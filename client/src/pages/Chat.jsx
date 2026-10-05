import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';
import useAuth from '../hooks/useAuth.js';
import useChat from '../hooks/useChat.js';
import useLanguage from '../hooks/useLanguage.js';
import chatService from '../services/chatService.js';
import { isSoundMuted, toggleSoundMuted } from '../utils/soundUtils.js';

const QUICK_REPLIES = [
  '👋 สวัสดีครับ/ค่ะ',
  '✅ รับทราบครับผม',
  '🙏 ขอบคุณมากครับ/ค่ะ',
  '💻 ขอสอบถามเรื่องงานไอทีครับ',
  '📄 ส่งเอกสารเรียบร้อยแล้วครับ',
  '☕ เที่ยงนี้ไปทานข้าวด้วยกันไหมครับ',
];

const QUICK_EMOJIS = ['👍', '❤️', '😊', '🎉', '🚀', '💻', '🔥', '👏', '☕', '✅', '🙏', '✨'];

const getSenderName = (sender) => {
  if (!sender) return 'User';
  const s = typeof sender === 'object' ? sender : {};
  const emp = s.employeeId || s.internId;
  if (emp?.firstName) {
    const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ');
    return emp.nickname ? `${name} (${emp.nickname})` : name;
  }
  if (s.firstName) {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
    return s.nickname ? `${name} (${s.nickname})` : name;
  }
  return s.username || 'User';
};

const getSenderRole = (sender) => {
  if (!sender) return '';
  const s = typeof sender === 'object' ? sender : {};
  return s.employeeId?.position || (s.internId ? 'นักศึกษาฝึกงาน' : s.role || '');
};

const formatDateDivider = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'วันนี้';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'เมื่อวาน';
  }
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'เมื่อวาน';
  if (diffDays < 7) {
    return d.toLocaleDateString('th-TH', { weekday: 'short' });
  }
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

export default function Chat() {
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    activeConversation,
    selectConversation,
    messages,
    loadingMessages,
    sendMessage,
    startTyping,
    stopTyping,
    activeTypingUsers,
    openDirectChat,
    openSupportChat,
    isUserOnline,
  } = useChat();
  const { t } = useLanguage();

  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'direct' | 'channel' | 'support'
  const [colleagueModalOpen, setColleagueModalOpen] = useState(false);
  const [colleagueSearch, setColleagueSearch] = useState('');
  const [colleagueDeptFilter, setColleagueDeptFilter] = useState('all');
  const [colleagueResults, setColleagueResults] = useState([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);

  // In-Chat features
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(isSoundMuted());
  const [lightboxImage, setLightboxImage] = useState(null);

  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (activeConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversation]);

  // Colleague search debounced
  useEffect(() => {
    if (!colleagueModalOpen) return;
    let timer = setTimeout(async () => {
      setLoadingColleagues(true);
      try {
        const results = await chatService.searchColleagues(colleagueSearch.trim());
        setColleagueResults(results || []);
      } catch (err) {
        console.error('Failed to search colleagues:', err);
      } finally {
        setLoadingColleagues(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [colleagueSearch, colleagueModalOpen]);

  const handleToggleSound = () => {
    const next = toggleSoundMuted();
    setSoundMutedState(next);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() && pendingAttachments.length === 0) return;
    const text = inputVal;
    const attachs = [...pendingAttachments];
    setInputVal('');
    setPendingAttachments([]);
    stopTyping();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text, attachs);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1500);

    // Auto resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleInsertEmoji = (emoji) => {
    setInputVal((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleQuickReply = (text) => {
    setInputVal(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingAttachment(true);
    try {
      const data = await chatService.uploadAttachment(file);
      setPendingAttachments((prev) => [...prev, data]);
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      alert('ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePendingAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startDirectWithUser = async (targetUser) => {
    try {
      await openDirectChat(targetUser._id);
      setColleagueModalOpen(false);
      setColleagueSearch('');
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  // Helper to extract details from conversation
  const getConvDetails = (conv) => {
    if (!conv) return { name: '', role: '', isOnline: false, avatar: '', type: 'direct' };

    if (conv.type === 'channel') {
      return {
        name: conv.title || 'ห้องพูดคุยกลุ่ม',
        role: conv.description || `${conv.participants?.length || 0} สมาชิก`,
        isOnline: true,
        avatar: conv.icon || '💬',
        isChannel: true,
        type: 'channel',
        typeLabel: 'กลุ่มส่วนกลาง',
        description: conv.description || '',
        participants: conv.participants || [],
      };
    }

    if (conv.type === 'support') {
      const dept = conv.supportDepartment || conv.department || (conv.title?.toLowerCase().includes('it') ? 'it' : 'hr');
      const isIT = dept === 'it';
      return {
        name: conv.title || (isIT ? t('itHelpdeskSupport') : t('hrSupport')),
        role: isIT ? 'ระบบบริการและความช่วยเหลือด้านไอที' : 'ฝ่ายทรัพยากรบุคคลและเอกสาร',
        isOnline: true,
        avatar: isIT ? '💻' : '👥',
        isSupport: true,
        type: 'support',
        typeLabel: isIT ? 'IT Helpdesk' : 'HR Support',
        description: conv.description || (isIT ? 'แจ้งปัญหาคอมพิวเตอร์ Wi-Fi หรืออุปกรณ์ไอที' : 'สอบถามเอกสาร สวัสดิการ และการฝึกงาน'),
        participants: conv.participants || [],
      };
    }

    const other = conv.participants?.find((p) => (p._id?.toString() || p.toString()) !== user?._id) || {};
    const emp = other.employeeId || other.internId;
    const fullName = emp
      ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
      : other.username || 'เพื่อนร่วมงาน';
    const nickname = emp?.nickname ? ` (${emp.nickname})` : '';
    const name = fullName + nickname;
    const role = emp?.position || (other.internId ? 'นักศึกษาฝึกงาน' : other.role || '');
    const deptName = emp?.departmentId?.name || '';

    return {
      name,
      role,
      department: deptName,
      isOnline: isUserOnline(other._id),
      avatar: emp?.profileImage || '',
      initials: fullName.slice(0, 2).toUpperCase(),
      type: 'direct',
      typeLabel: '1:1 ส่วนตัว',
      otherUser: other,
      employeeDetails: emp,
    };
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (typeFilter === 'direct') {
      list = list.filter((c) => c.type === 'direct');
    } else if (typeFilter === 'channel') {
      list = list.filter((c) => c.type === 'channel');
    } else if (typeFilter === 'support') {
      list = list.filter((c) => c.type === 'support');
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => {
      const info = getConvDetails(c);
      return (
        info.name.toLowerCase().includes(q) ||
        (c.lastMessage?.text || '').toLowerCase().includes(q) ||
        (info.role || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, typeFilter]);

  const currentInfo = getConvDetails(activeConversation);

  // Group messages by Date and consecutive senders
  const processedMessages = useMemo(() => {
    const items = [];
    let lastDate = '';
    let lastSenderId = '';
    let lastTime = 0;

    const filtered = inChatSearchQuery.trim()
      ? messages.filter((m) =>
          (m.content || '').toLowerCase().includes(inChatSearchQuery.toLowerCase())
        )
      : messages;

    filtered.forEach((msg, idx) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        items.push({
          type: 'divider',
          id: `div_${msgDate}_${idx}`,
          label: formatDateDivider(msg.createdAt),
        });
        lastDate = msgDate;
        lastSenderId = '';
      }

      const senderId = String(msg.senderId?._id || msg.senderId);
      const msgTime = new Date(msg.createdAt).getTime();
      const isSameSenderAsPrev =
        senderId === lastSenderId && msgTime - lastTime < 5 * 60 * 1000;

      items.push({
        type: 'message',
        data: msg,
        isGrouped: isSameSenderAsPrev,
      });

      lastSenderId = senderId;
      lastTime = msgTime;
    });

    return items;
  }, [messages, inChatSearchQuery]);

  // Extract shared media/files from current conversation messages
  const sharedMedia = useMemo(() => {
    const list = [];
    messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          list.push({ ...att, createdAt: msg.createdAt, sender: msg.senderId });
        });
      }
    });
    return list.reverse();
  }, [messages]);

  // Filter colleague modal results by department
  const filteredColleagues = useMemo(() => {
    if (colleagueDeptFilter === 'all') return colleagueResults;
    return colleagueResults.filter((u) => {
      const deptName = u.department?.toLowerCase() || '';
      const role = u.role?.toLowerCase() || '';
      if (colleagueDeptFilter === 'intern') return role.includes('intern') || u.position?.toLowerCase().includes('intern');
      return deptName.includes(colleagueDeptFilter.toLowerCase());
    });
  }, [colleagueResults, colleagueDeptFilter]);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>{t('dashboard')}</span>
            <span>/</span>
            <span className="text-primary-600 font-semibold">{t('chat')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
            <span>{t('chatTitle')}</span>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/20">
              UI/UX Promax
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition shadow-xs ${
              soundMuted
                ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={soundMuted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
          >
            <span>{soundMuted ? '🔕' : '🔔'}</span>
            <span className="hidden sm:inline">{soundMuted ? 'ปิดเสียงอยู่' : 'เปิดเสียงอยู่'}</span>
          </button>

          <button
            type="button"
            onClick={() => setColleagueModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-primary-700 hover:to-primary-800 transition active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ แชทใหม่ (1:1)</span>
          </button>
        </div>
      </div>

      {/* Main Chat App Container */}
      <div className="grid h-[calc(100vh-12.5rem)] min-h-[600px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        
        {/* Left Sidebar: Conversations & Navigation */}
        <div className={`flex flex-col border-r border-slate-200 bg-slate-50/60 ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search bar & Category Tabs */}
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อคน แผนก หรือข้อความ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/90 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 4 Categorized Filter Pills */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`rounded-lg py-1.5 transition text-center ${
                  typeFilter === 'all'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('direct')}
                className={`rounded-lg py-1.5 transition text-center ${
                  typeFilter === 'direct'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👤 1:1
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('channel')}
                className={`rounded-lg py-1.5 transition text-center ${
                  typeFilter === 'channel'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👥 กลุ่ม
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('support')}
                className={`rounded-lg py-1.5 transition text-center ${
                  typeFilter === 'support'
                    ? 'bg-white text-primary-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🛠️ ช่วยเหลือ
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/90">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">กำลังโหลดบทสนทนา...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-3xl">💬</span>
                <p className="mt-2 text-xs font-medium text-slate-600">ไม่พบบทสนทนา</p>
                <button
                  type="button"
                  onClick={() => setColleagueModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
                >
                  <span>+</span> เริ่มต้นทักทายเพื่อนร่วมงาน
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const info = getConvDetails(conv);
                const isSelected = activeConversation?._id === conv._id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => selectConversation(conv)}
                    className={`group flex w-full items-center gap-3 p-3.5 text-left transition-all ${
                      isSelected
                        ? 'bg-primary-50/80 border-l-4 border-primary-600 shadow-xs'
                        : 'hover:bg-slate-100/70 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar with Status Indicator */}
                    <div className="relative shrink-0">
                      {info.isChannel || info.isSupport ? (
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl shadow-xs ring-1 ${
                          info.isSupport
                            ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 ring-indigo-200'
                            : 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 ring-amber-200'
                        }`}>
                          {info.avatar}
                        </span>
                      ) : info.avatar ? (
                        <img
                          src={info.avatar}
                          alt=""
                          className="h-11 w-11 rounded-2xl object-cover shadow-xs ring-1 ring-slate-200"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-xs font-bold text-white shadow-xs">
                          {info.initials}
                        </span>
                      )}

                      {/* Online Status Dot */}
                      {info.type === 'direct' && info.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`truncate text-xs ${hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                            {info.name}
                          </p>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                            info.type === 'direct'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : info.type === 'channel'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {info.typeLabel}
                          </span>
                        </div>

                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatRelativeTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className={`truncate text-[11px] mt-0.5 ${hasUnread ? 'font-semibold text-primary-700' : 'text-slate-500'}`}>
                        {conv.lastMessage?.text || 'เริ่มต้นการสนทนาใหม่...'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {hasUnread && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window Area */}
        <div className={`flex flex-col bg-slate-50/40 relative ${!activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Active Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shadow-xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => selectConversation(null)}
                    className="mr-1 rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                    title={t('back')}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="relative shrink-0">
                    {currentInfo.isChannel || currentInfo.isSupport ? (
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-xs ring-1 ring-slate-200">
                        {currentInfo.avatar}
                      </span>
                    ) : currentInfo.avatar ? (
                      <img
                        src={currentInfo.avatar}
                        alt=""
                        className="h-11 w-11 rounded-2xl object-cover shadow-xs ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-bold text-white shadow-xs">
                        {currentInfo.initials}
                      </span>
                    )}
                    {currentInfo.type === 'direct' && currentInfo.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {currentInfo.name}
                      </h2>
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {currentInfo.typeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {currentInfo.type === 'direct' ? (
                        currentInfo.isOnline ? (
                          <span className="font-semibold text-emerald-600">● กำลังใช้งาน</span>
                        ) : (
                          <span className="text-slate-400">ออฟไลน์</span>
                        )
                      ) : (
                        <span className="text-slate-600 font-medium">{currentInfo.role}</span>
                      )}
                      {currentInfo.department && ` • ${currentInfo.department}`}
                    </p>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowInChatSearch((prev) => !prev)}
                    className={`rounded-xl p-2 transition text-xs font-medium ${
                      showInChatSearch
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="ค้นหาข้อความในห้องนี้"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                    title={soundMuted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
                  >
                    <span className="text-sm">{soundMuted ? '🔕' : '🔔'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInfoDrawer((prev) => !prev)}
                    className={`rounded-xl p-2 transition ${
                      showInfoDrawer
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="ดูข้อมูลโปรไฟล์และไฟล์แนบ"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* In-Chat Search Bar (Dropdown) */}
              {showInChatSearch && (
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5 animate-fadeIn">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="ค้นหาข้อความในห้องสนทนานี้..."
                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                    autoFocus
                  />
                  {inChatSearchQuery && (
                    <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      พบ {processedMessages.filter((m) => m.type === 'message').length} ข้อความ
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInChatSearch(false);
                      setInChatSearchQuery('');
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Content Grid (Messages Area + Optional Info Drawer) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      กำลังโหลดประวัติข้อความ...
                    </div>
                  ) : processedMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6">
                      <span className="text-4xl mb-2">👋</span>
                      <p className="text-sm font-bold text-slate-800">เริ่มต้นการพูดคุยกับ {currentInfo.name}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">พิมพ์ข้อความด้านล่าง หรือเลือกชิปข้อความตอบกลับด่วนเพื่อเริ่มต้นสนทนา</p>
                    </div>
                  ) : (
                    processedMessages.map((item) => {
                      if (item.type === 'divider') {
                        return (
                          <div key={item.id} className="flex items-center justify-center my-4">
                            <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-bold text-slate-600 shadow-2xs">
                              {item.label}
                            </span>
                          </div>
                        );
                      }

                      const msg = item.data;
                      const isMe = (msg.senderId?._id || msg.senderId) === user?._id;
                      const senderObj = msg.senderId;
                      const senderName = getSenderName(senderObj);
                      const senderRole = getSenderRole(senderObj);
                      const isRead = msg.readBy && msg.readBy.length > 1;

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                            item.isGrouped ? 'mt-1' : 'mt-3.5'
                          }`}
                        >
                          <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                            {!isMe && (
                              <div className="w-8 shrink-0 flex justify-center">
                                {!item.isGrouped ? (
                                  <div className="h-8 w-8 rounded-xl bg-slate-100 overflow-hidden shadow-xs ring-1 ring-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                    {msg.senderId?.employeeId?.profileImage || msg.senderId?.profileImage ? (
                                      <img
                                        src={msg.senderId?.employeeId?.profileImage || msg.senderId?.profileImage}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      (senderName || 'U').slice(0, 1).toUpperCase()
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-8" />
                                )}
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                                isMe
                                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-2xs'
                                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-2xs'
                              }`}
                            >
                              {/* Sender Header for non-me in channels or when not grouped */}
                              {!isMe && !item.isGrouped && (
                                <div className="mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                                  <span className="text-xs font-bold text-primary-700">
                                    {senderName}
                                  </span>
                                  {senderRole && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      • {senderRole}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Message text */}
                              {msg.content && (
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              )}

                              {/* Message attachments (images or files) */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`space-y-2 ${msg.content ? 'mt-2.5' : ''}`}>
                                  {msg.attachments.map((att, attIdx) => {
                                    if (att.fileType === 'image') {
                                      return (
                                        <div
                                          key={attIdx}
                                          onClick={() => setLightboxImage(att.url)}
                                          className="group/img relative cursor-pointer overflow-hidden rounded-xl border border-black/10 shadow-xs max-w-sm"
                                        >
                                          <img
                                            src={att.url}
                                            alt=""
                                            className="max-h-60 w-full object-cover transition duration-200 group-hover/img:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                                            <span>🔍 คลิกเพื่อขยายภาพ</span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <a
                                        key={attIdx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.name || 'file'}
                                        className={`flex items-center gap-2 rounded-xl p-2 text-xs transition ${
                                          isMe
                                            ? 'bg-white/15 hover:bg-white/25 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                        }`}
                                      >
                                        <span className="text-lg">📎</span>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold truncate">{att.name || 'เอกสารแนบ'}</p>
                                          <p className="text-[10px] opacity-75">
                                            {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'ดาวน์โหลดไฟล์'}
                                          </p>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Time & Read Status Indicator */}
                          <div className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${isMe ? 'mr-1' : 'ml-10'}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && (
                              <span className={`font-bold ml-0.5 ${isRead ? 'text-primary-600' : 'text-slate-400'}`}>
                                {isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {activeTypingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic px-2 animate-fadeIn">
                      <span className="inline-flex gap-1 items-center bg-white border border-slate-200 px-2 py-1 rounded-full shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]" />
                      </span>
                      <span>{activeTypingUsers.join(', ')} กำลังพิมพ์...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Right Profile & Info Drawer */}
                {showInfoDrawer && (
                  <div className="w-72 border-l border-slate-200 bg-white p-4 overflow-y-auto space-y-4 animate-slideLeft shrink-0">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800">ข้อมูลบทสนทนา</h3>
                      <button
                        type="button"
                        onClick={() => setShowInfoDrawer(false)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Participant / Channel Overview */}
                    <div className="text-center py-2">
                      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                        {currentInfo.avatar ? (
                          currentInfo.isChannel || currentInfo.isSupport ? (
                            currentInfo.avatar
                          ) : (
                            <img src={currentInfo.avatar} alt="" className="h-full w-full object-cover" />
                          )
                        ) : (
                          currentInfo.initials
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{currentInfo.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{currentInfo.role}</p>
                      {currentInfo.department && (
                        <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-semibold text-primary-700">
                          {currentInfo.department}
                        </span>
                      )}
                    </div>

                    {/* Channel Description */}
                    {currentInfo.description && (
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800 block text-[11px]">รายละเอียด:</span>
                        <p className="leading-relaxed">{currentInfo.description}</p>
                      </div>
                    )}

                    {/* Shared Media Gallery in this chat */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">รูปภาพและไฟล์ ({sharedMedia.length})</span>
                      </div>

                      {sharedMedia.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-2">ยังไม่มีไฟล์หรือรูปภาพในห้องนี้</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {sharedMedia.map((med, mIdx) => (
                            <div
                              key={mIdx}
                              onClick={() => med.fileType === 'image' && setLightboxImage(med.url)}
                              className="aspect-square cursor-pointer overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-2xs hover:opacity-80 transition flex items-center justify-center text-xs"
                            >
                              {med.fileType === 'image' ? (
                                <img src={med.url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xl">📄</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Toolbar & Input Area */}
              <div className="border-t border-slate-200 bg-white p-3 sm:p-4 space-y-2 z-10">
                {/* Pending Attachment Preview Bar */}
                {pendingAttachments.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {pendingAttachments.map((att, attIdx) => (
                      <div
                        key={attIdx}
                        className="relative flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 p-1.5 pr-6 text-xs shadow-2xs"
                      >
                        {att.fileType === 'image' ? (
                          <img src={att.url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <span className="text-base">📎</span>
                        )}
                        <span className="truncate max-w-[120px] font-medium text-slate-700">
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(attIdx)}
                          className="absolute right-1 top-1.5 text-slate-400 hover:text-rose-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Replies Chips Carousel */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">ตอบด่วน:</span>
                  {QUICK_REPLIES.map((reply, rIdx) => (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition active:scale-[0.98]"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Input Controls Bar */}
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  {/* File Upload Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
                    title="แนบรูปภาพหรือไฟล์"
                  >
                    {uploadingAttachment ? (
                      <span className="animate-spin text-sm">⏳</span>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>

                  {/* Quick Emojis Dropdown / Mini Bar */}
                  <div className="hidden sm:flex items-center gap-0.5">
                    {QUICK_EMOJIS.slice(0, 5).map((em, eIdx) => (
                      <button
                        key={eIdx}
                        type="button"
                        onClick={() => handleInsertEmoji(em)}
                        className="rounded-lg p-1.5 text-base hover:bg-slate-100 transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  {/* Multi-line autosizing textarea */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={inputVal}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่)"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 max-h-32"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputVal.trim() && pendingAttachments.length === 0}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-primary-700 hover:to-primary-800 disabled:opacity-40 transition active:scale-[0.98]"
                  >
                    <span>ส่ง</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-4xl shadow-inner ring-1 ring-primary-100">
                💬
              </div>
              <h2 className="text-xl font-bold text-slate-900">ระบบแชทและการสื่อสาร FTI Welcome Hub</h2>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
                ติดต่อสื่อสารกับเพื่อนร่วมงาน พี่เลี้ยง และศูนย์ช่วยเหลือของ FTI ได้สะดวก รวดเร็ว และเป็นกันเอง
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setColleagueModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-primary-700 hover:to-primary-800 transition active:scale-[0.98]"
                >
                  <span>👤</span> ค้นหาและเริ่มคุยกับเพื่อนร่วมงาน (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => openSupportChat('it')}
                  className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100"
                >
                  <span>💻</span> ศูนย์ช่วยเหลือไอที (IT Support)
                </button>
                <button
                  type="button"
                  onClick={() => openSupportChat('hr')}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <span>👥</span> ฝ่ายทรัพยากรบุคคล (HR Support)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div className="relative max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt=""
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                download="chat_image"
                className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition text-xs"
                title="ดาวน์โหลดภาพ"
              >
                📥
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition text-xs"
                title="ปิด"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Start Chat with Colleague Modal */}
      <Modal
        open={colleagueModalOpen}
        onClose={() => setColleagueModalOpen(false)}
        title="ค้นหาเพื่อนร่วมงานและเริ่มบทสนทนา (1:1)"
        size="md"
      >
        <div className="space-y-3.5">
          <div className="relative">
            <input
              type="text"
              value={colleagueSearch}
              onChange={(e) => setColleagueSearch(e.target.value)}
              placeholder="พิมพ์ชื่อ นามสกุล ชื่อเล่น หรือตำแหน่งเพื่อค้นหา..."
              className="w-full rounded-xl border border-slate-300 p-2.5 pl-9 text-xs sm:text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
            <svg className="absolute left-3 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {['all', 'Information Technology', 'Human Resources', 'Marketing', 'Sales', 'intern'].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setColleagueDeptFilter(dept)}
                className={`rounded-full px-2.5 py-1 transition ${
                  colleagueDeptFilter === dept
                    ? 'bg-primary-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept === 'all'
                  ? 'ทั้งหมด'
                  : dept === 'intern'
                  ? '🎓 นักศึกษาฝึกงาน'
                  : dept.replace('Information Technology', 'IT').replace('Human Resources', 'HR')}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loadingColleagues ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">กำลังค้นหารายชื่อ...</div>
            ) : filteredColleagues.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {colleagueSearch ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'กำลังแสดงรายชื่อเพื่อนร่วมงานทั้งหมด'}
              </div>
            ) : (
              filteredColleagues.map((u) => {
                const isOnline = isUserOnline(u._id);

                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {u.profileImage ? (
                          <img
                            src={u.profileImage}
                            alt=""
                            className="h-10 w-10 rounded-2xl object-cover shadow-2xs ring-1 ring-slate-200"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-xs font-bold text-white shadow-2xs">
                            {u.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{u.name}</p>
                          {u.nickname && (
                            <span className="text-xs text-slate-500 font-medium shrink-0">({u.nickname})</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {u.position} {u.department && `• ${u.department}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startDirectWithUser(u)}
                      className="shrink-0 rounded-xl bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition active:scale-[0.98]"
                    >
                      เริ่มแชท 💬
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
