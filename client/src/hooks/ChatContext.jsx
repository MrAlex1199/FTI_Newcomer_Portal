import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from './useAuth.js';
import chatService from '../services/chatService.js';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [typingMap, setTypingMap] = useState({}); // { [convId]: { [userId]: userName } }
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const activeConvRef = useRef(null);
  activeConvRef.current = activeConversation;

  // Initialize socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
      // If there's an active conversation, re-join room
      if (activeConvRef.current?._id) {
        s.emit('conversation:join', { conversationId: activeConvRef.current._id });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('users:online', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    s.on('user:status', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    s.on('message:new', (msg) => {
      const activeId = activeConvRef.current?._id;
      if (activeId && String(msg.conversationId) === String(activeId)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Immediately emit read receipt if active
        s.emit('message:read', { conversationId: activeId });
      }
    });

    s.on('conversation:updated', ({ conversationId, lastMessage, unreadCount }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === conversationId);
        if (!exists) {
          // If brand new conversation, reload list
          chatService.getConversations().then(setConversations).catch(() => {});
          return prev;
        }
        return prev.map((c) => {
          if (c._id === conversationId) {
            const isCurrentlyActive = activeConvRef.current?._id === conversationId;
            return {
              ...c,
              lastMessage: lastMessage || c.lastMessage,
              unreadCount: isCurrentlyActive ? 0 : (unreadCount !== undefined ? unreadCount : c.unreadCount),
            };
          }
          return c;
        }).sort((a, b) => {
          const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
          const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
          return timeB - timeA;
        });
      });
    });

    s.on('typing:status', ({ conversationId, userId: typerId, isTyping, user: typerUser }) => {
      setTypingMap((prev) => {
        const convTyping = { ...(prev[conversationId] || {}) };
        if (isTyping) {
          convTyping[typerId] = typerUser?.name || 'Someone';
        } else {
          delete convTyping[typerId];
        }
        return { ...prev, [conversationId]: convTyping };
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, user]);

  // Load conversations initially when authenticated
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const list = await chatService.getConversations();
      setConversations(list || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [isAuthenticated, loadConversations]);

  // Select conversation and load messages
  const selectConversation = useCallback(async (convOrId) => {
    const convId = typeof convOrId === 'string' ? convOrId : convOrId?._id;
    if (!convId) {
      if (activeConvRef.current && socket) {
        socket.emit('conversation:leave', { conversationId: activeConvRef.current._id });
      }
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    if (activeConvRef.current?._id && socket && activeConvRef.current._id !== convId) {
      socket.emit('conversation:leave', { conversationId: activeConvRef.current._id });
    }

    if (socket) {
      socket.emit('conversation:join', { conversationId: convId });
      socket.emit('message:read', { conversationId: convId });
    }

    let targetConv = typeof convOrId === 'object' ? convOrId : conversations.find((c) => c._id === convId);
    if (!targetConv) {
      // Find or fallback
      targetConv = { _id: convId };
    }

    setActiveConversation({ ...targetConv, unreadCount: 0 });
    setConversations((prev) =>
      prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
    );

    setLoadingMessages(true);
    try {
      const history = await chatService.getMessages(convId);
      setMessages(history || []);
      await chatService.markAsRead(convId).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch messages for conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversations, socket]);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!activeConversation?._id || !content?.trim()) return null;
    const trimmed = content.trim();

    // Socket optimistic / direct emit
    if (socket && isConnected) {
      return new Promise((resolve, reject) => {
        socket.emit('message:send', { conversationId: activeConversation._id, content: trimmed }, (res) => {
          if (res?.success) {
            resolve(res.data);
          } else {
            // fallback to REST API
            chatService.sendMessage(activeConversation._id, trimmed)
              .then(resolve)
              .catch(reject);
          }
        });
      });
    } else {
      const res = await chatService.sendMessage(activeConversation._id, trimmed);
      setMessages((prev) => [...prev, res]);
      return res;
    }
  }, [activeConversation, socket, isConnected]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (socket && activeConversation?._id) {
      socket.emit('typing:start', { conversationId: activeConversation._id });
    }
  }, [socket, activeConversation]);

  const stopTyping = useCallback(() => {
    if (socket && activeConversation?._id) {
      socket.emit('typing:stop', { conversationId: activeConversation._id });
    }
  }, [socket, activeConversation]);

  // Open direct chat with another user
  const openDirectChat = useCallback(async (targetUserId) => {
    try {
      const conv = await chatService.getOrCreateDirectConversation(targetUserId);
      await loadConversations();
      await selectConversation(conv);
      return conv;
    } catch (err) {
      console.error('Failed to open direct chat:', err);
      throw err;
    }
  }, [loadConversations, selectConversation]);

  // Open support chat with IT or HR
  const openSupportChat = useCallback(async (department) => {
    try {
      const conv = await chatService.getOrCreateSupportConversation(department);
      await loadConversations();
      await selectConversation(conv);
      return conv;
    } catch (err) {
      console.error(`Failed to open support chat for ${department}:`, err);
      throw err;
    }
  }, [loadConversations, selectConversation]);

  // Compute total unread count
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Current active typing users list
  const activeTypingUsers = useMemo(() => {
    if (!activeConversation?._id) return [];
    const convTyping = typingMap[activeConversation._id] || {};
    return Object.entries(convTyping)
      .filter(([uid]) => uid !== user?._id)
      .map(([, name]) => name);
  }, [activeConversation, typingMap, user]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      onlineUsers,
      isUserOnline: (userId) => (userId ? onlineUsers.has(String(userId)) : false),
      conversations,
      loadingConversations,
      activeConversation,
      messages,
      loadingMessages,
      totalUnreadCount,
      activeTypingUsers,
      isWidgetOpen,
      setIsWidgetOpen,
      loadConversations,
      selectConversation,
      sendMessage,
      startTyping,
      stopTyping,
      openDirectChat,
      openSupportChat,
    }),
    [
      socket,
      isConnected,
      onlineUsers,
      conversations,
      loadingConversations,
      activeConversation,
      messages,
      loadingMessages,
      totalUnreadCount,
      activeTypingUsers,
      isWidgetOpen,
      loadConversations,
      selectConversation,
      sendMessage,
      startTyping,
      stopTyping,
      openDirectChat,
      openSupportChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
