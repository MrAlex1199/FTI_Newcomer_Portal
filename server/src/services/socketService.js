import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/cookies.js';
import { User, Conversation, ChatMessage } from '../models/index.js';

let ioInstance = null;
const onlineUserSockets = new Map(); // userId -> Set of socketIds

const parseCookieString = (cookieHeader = '') => {
  const cookies = {};
  cookieHeader.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
};

export const initSocketServer = (httpServer) => {
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware for Socket.io
  ioInstance.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookieString(socket.handshake.headers.cookie);
        token = cookies[ACCESS_TOKEN_COOKIE];
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub)
        .select('_id username role firstName lastName employeeId internId isActive')
        .populate('employeeId', 'firstName lastName nickname position profileImage departmentId')
        .populate('internId', 'firstName lastName nickname departmentId')
        .lean();

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track online state
    if (!onlineUserSockets.has(userId)) {
      onlineUserSockets.set(userId, new Set());
      ioInstance.emit('user:status', { userId, isOnline: true });
    }
    onlineUserSockets.get(userId).add(socket.id);

    // Join personal notification room
    socket.join(`user_${userId}`);

    // Send currently online user IDs to the connected client
    socket.emit('users:online', Array.from(onlineUserSockets.keys()));

    // Join conversation room
    socket.on('conversation:join', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        isTyping: true,
        user: {
          id: userId,
          username: socket.user.username,
          name: socket.user.employeeId?.firstName || socket.user.firstName || socket.user.username,
        },
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Send message event
    socket.on('message:send', async ({ conversationId, content }, callback) => {
      try {
        if (!conversationId || !content?.trim()) {
          return callback?.({ success: false, error: 'Invalid message data' });
        }

        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          return callback?.({ success: false, error: 'Conversation not found' });
        }

        // Verify user is in conversation
        const isParticipant = conv.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return callback?.({ success: false, error: 'Not authorized for this conversation' });
        }

        // Create ChatMessage
        const message = await ChatMessage.create({
          conversationId,
          senderId: userId,
          content: content.trim(),
          readBy: [userId],
        });

        // Update Conversation lastMessage & unread count
        conv.lastMessage = {
          text: content.trim(),
          senderId: userId,
          createdAt: message.createdAt,
        };

        // Increment unread count for other participants
        conv.participants.forEach((p) => {
          const pStr = p.toString();
          if (pStr !== userId) {
            const current = conv.unreadCounts.get(pStr) || 0;
            conv.unreadCounts.set(pStr, current + 1);
          }
        });
        await conv.save();

        const populatedMsg = await ChatMessage.findById(message._id)
          .populate({
            path: 'senderId',
            select: 'username role firstName lastName employeeId internId',
            populate: [
              { path: 'employeeId', select: 'firstName lastName nickname position profileImage' },
              { path: 'internId', select: 'firstName lastName nickname' },
            ],
          })
          .lean();

        // Broadcast to conversation room
        ioInstance.to(`conv_${conversationId}`).emit('message:new', populatedMsg);

        // Notify participants personal rooms to update conversation preview and unread count
        conv.participants.forEach((p) => {
          const pStr = p.toString();
          ioInstance.to(`user_${pStr}`).emit('conversation:updated', {
            conversationId: conv._id,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCounts.get(pStr) || 0,
          });
        });

        callback?.({ success: true, data: populatedMsg });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Mark as read event
    socket.on('message:read', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) return;

        await ChatMessage.updateMany(
          { conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        const conv = await Conversation.findById(conversationId);
        if (conv) {
          conv.unreadCounts.set(userId, 0);
          await conv.save();
        }

        ioInstance.to(`conv_${conversationId}`).emit('message:read_receipt', {
          conversationId,
          readByUserId: userId,
        });

        socket.emit('conversation:updated', {
          conversationId,
          unreadCount: 0,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUserSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUserSockets.delete(userId);
          ioInstance.emit('user:status', { userId, isOnline: false });
        }
      }
    });
  });

  return ioInstance;
};

export const getSocketIO = () => ioInstance;

export const isUserOnline = (userId) => {
  return onlineUserSockets.has(userId.toString());
};
