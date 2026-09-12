import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useChat from '../../hooks/useChat.js';
import useLanguage from '../../hooks/useLanguage.js';
import chatService from '../../services/chatService.js';

const getSenderName = (sender) => {
  if (!sender) return 'User';
  const s = typeof sender === 'object' ? sender : {};
  const emp = s.employeeId || s.internId;
  if (emp?.firstName) {
    return [emp.firstName, emp.lastName].filter(Boolean).join(' ');
  }
  if (s.firstName) {
    return [s.firstName, s.lastName].filter(Boolean).join(' ');
  }
  return s.username || 'User';
};

const getSenderRole = (sender) => {
  if (!sender) return '';
  const s = typeof sender === 'object' ? sender : {};
  return s.employeeId?.position || s.role || '';
};

export default function FloatingChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const {
    isWidgetOpen,
    setIsWidgetOpen,
    totalUnreadCount,
    conversations,
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
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState('');
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'support' | 'chats'
  const [startingSupport, setStartingSupport] = useState(false);
  const [colleagueSearch, setColleagueSearch] = useState('');
  const [colleagues, setColleagues] = useState([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (activeConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversation]);

  // Load colleagues when switching to 'direct' tab
  useEffect(() => {
    if (!isWidgetOpen || activeTab !== 'direct') return;
    let timer = setTimeout(async () => {
      setLoadingColleagues(true);
      try {
        const list = await chatService.searchColleagues(colleagueSearch.trim());
        setColleagues(list || []);
      } catch (err) {
        console.error('Failed to load colleagues in widget:', err);
      } finally {
        setLoadingColleagues(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isWidgetOpen, activeTab, colleagueSearch]);

  if (!isAuthenticated || !user) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal;
    setInputVal('');
    stopTyping();
    await sendMessage(text);
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1500);
  };

  const handleSupportClick = async (dept) => {
    setStartingSupport(true);
    try {
      await openSupportChat(dept);
    } finally {
      setStartingSupport(false);
    }
  };

  const handleDirectClick = async (targetUser) => {
    try {
      await openDirectChat(targetUser._id);
    } catch (err) {
      console.error('Failed to open direct chat:', err);
    }
  };

  const openFullScreenChat = () => {
    setIsWidgetOpen(false);
    navigate('/chat');
  };

  const getRecipientInfo = (conv) => {
    if (!conv) return { name: '', role: '', isOnline: false, avatar: '', type: 'direct' };
    if (conv.type === 'support') {
      const dept = conv.supportDepartment || conv.department || (conv.title?.toLowerCase().includes('it') ? 'it' : 'hr');
      const isIT = dept === 'it';
      return {
        name: isIT ? t('itHelpdeskSupport') : t('hrSupport'),
        role: isIT ? t('itSupportSub') : t('hrSupportSub'),
        isOnline: true,
        avatar: isIT ? '💻' : '👥',
        isSupport: true,
        type: 'support',
        typeLabel: isIT ? 'IT Helpdesk' : 'HR Team',
      };
    }
    if (conv.type === 'group') {
      return {
        name: conv.title || t('groupChatBadge'),
        role: t('membersCount', { count: conv.participants?.length || 0 }),
        isOnline: true,
        avatar: '👥',
        isGroup: true,
        type: 'group',
        typeLabel: t('groupChatBadge'),
      };
    }
    const other = conv.participants?.find((p) => p._id !== user._id) || {};
    const name = other.employeeId
      ? `${other.employeeId.firstName || ''} ${other.employeeId.lastName || ''}`.trim() || other.username
      : other.username || 'Colleague';
    return {
      name,
      role: other.employeeId?.position || other.role || '',
      isOnline: isUserOnline(other._id),
      avatar: other.employeeId?.profileImage || '',
      initials: name.slice(0, 2).toUpperCase(),
      type: 'direct',
      typeLabel: t('directChatBadge'),
    };
  };

  const currentInfo = getRecipientInfo(activeConversation);

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end">
      {/* Expanded Widget Window */}
      {isWidgetOpen && (
        <div className="mb-3 flex h-[530px] max-h-[82vh] w-[calc(100vw-2rem)] max-w-sm sm:w-96 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-primary-800 bg-primary-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {activeConversation && (
                <button
                  type="button"
                  onClick={() => selectConversation(null)}
                  className="mr-1 rounded p-1 hover:bg-primary-800"
                  title={t('back')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold leading-tight">
                    {activeConversation ? currentInfo.name : t('ftiChatSupport')}
                  </h3>
                  {activeConversation && (
                    <span className="rounded bg-primary-800 px-1.5 py-0.2 text-[9px] text-primary-200">
                      {currentInfo.type === 'direct' ? '1:1' : 'Team'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-primary-200">
                  {activeConversation
                    ? currentInfo.isOnline
                      ? `● ${t('online')}`
                      : t('offline')
                    : t('directAndSupportChat')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openFullScreenChat}
                className="rounded-lg p-1.5 text-primary-200 hover:bg-primary-800 hover:text-white"
                title={t('openFullScreen')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsWidgetOpen(false)}
                className="rounded-lg p-1.5 text-primary-200 hover:bg-primary-800 hover:text-white"
                title={t('closeMenu')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Content */}
          {activeConversation ? (
            /* Active Chat View */
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    {t('loadingMessages')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-xs font-medium text-gray-600">{t('startNewChatPrompt')}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t('typeMessagePlaceholder')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = (msg.senderId?._id || msg.senderId) === user._id;
                    const senderObj = msg.senderId;
                    const senderName = getSenderName(senderObj);
                    const senderRole = getSenderRole(senderObj);
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-1.5 max-w-[85%]">
                          {!isMe && (
                            <div className="h-6 w-6 rounded-full bg-primary-100 shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold text-primary-700 border border-primary-200">
                              {msg.senderId?.employeeId?.profileImage ? (
                                <img
                                  src={msg.senderId.employeeId.profileImage}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (senderName || 'U').slice(0, 1).toUpperCase()
                              )}
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}
                          >
                            {/* Display sender's name on group/support chat or incoming message */}
                            {!isMe && (
                              <div className="mb-1 flex items-center gap-1 border-b border-gray-100 pb-0.5">
                                <span className="text-[11px] font-bold text-primary-700">
                                  {senderName}
                                </span>
                                {senderRole && (
                                  <span className="text-[9px] text-gray-400 font-normal">
                                    • {senderRole}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>

                        <span className={`mt-0.5 px-1 text-[9px] text-gray-400 ${isMe ? 'mr-1' : 'ml-7'}`}>
                          {timeStr}
                        </span>
                      </div>
                    );
                  })
                )}
                {/* Typing Indicator */}
                {activeTypingUsers.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 italic px-1">
                    <span className="inline-flex gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>{activeTypingUsers.join(', ')} {t('isTyping')}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-gray-200 bg-white p-2.5"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder={t('typeMessagePlaceholder')}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow hover:bg-primary-700 disabled:opacity-40"
                  title={t('sendMessage')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            /* Home / Navigation inside widget */
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Tab navigation */}
              <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-2.5 text-center transition ${
                    activeTab === 'direct'
                      ? 'border-b-2 border-primary-600 font-semibold text-primary-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👤 {t('colleaguesTab')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('support')}
                  className={`flex-1 py-2.5 text-center transition ${
                    activeTab === 'support'
                      ? 'border-b-2 border-primary-600 font-semibold text-primary-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🛠️ {t('supportTab')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 py-2.5 text-center transition relative ${
                    activeTab === 'chats'
                      ? 'border-b-2 border-primary-600 font-semibold text-primary-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  💬 {t('recentChats')}
                  {totalUnreadCount > 0 && (
                    <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] text-white">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab contents */}
              <div className="flex-1 overflow-y-auto p-3.5">
                {activeTab === 'direct' ? (
                  /* Colleagues (1-on-1 User to User) Tab */
                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={colleagueSearch}
                        onChange={(e) => setColleagueSearch(e.target.value)}
                        placeholder={t('searchColleaguePlaceholder')}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary-500 focus:bg-white"
                      />
                      <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                      {loadingColleagues ? (
                        <div className="py-6 text-center text-xs text-gray-400">{t('loading')}</div>
                      ) : colleagues.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">{t('noResults')}</div>
                      ) : (
                        colleagues.map((col) => {
                          const emp = col.employeeId || col.internId || {};
                          const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || col.username;
                          const pos = emp.position || col.role;
                          const isOnline = isUserOnline(col._id);

                          return (
                            <div
                              key={col._id}
                              className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  {emp.profileImage ? (
                                    <img
                                      src={emp.profileImage}
                                      alt=""
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                                      {name.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                  {isOnline && (
                                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-green-500" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-800">{name}</p>
                                  <p className="truncate text-[10px] text-gray-500">{pos}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDirectClick(col)}
                                className="shrink-0 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100 transition"
                              >
                                {t('startChat')}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : activeTab === 'support' ? (
                  /* Support Teams Tab */
                  <div className="space-y-3">
                    <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-blue-900 border border-blue-100">
                      <p className="font-semibold text-blue-800">{t('ftiHelpdeskGreeting')}</p>
                      <p className="mt-0.5 text-blue-700 text-[11px]">{t('ftiHelpdeskDesc')}</p>
                    </div>

                    {/* IT Support Option */}
                    <button
                      type="button"
                      disabled={startingSupport}
                      onClick={() => handleSupportClick('it')}
                      className="group flex w-full items-center gap-3.5 rounded-xl border border-gray-200 p-3 text-left transition hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg group-hover:scale-105 transition-transform">
                        💻
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{t('itHelpdeskSupport')}</p>
                        <p className="truncate text-[11px] text-gray-500">{t('itSupportSub')}</p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* HR Support Option */}
                    <button
                      type="button"
                      disabled={startingSupport}
                      onClick={() => handleSupportClick('hr')}
                      className="group flex w-full items-center gap-3.5 rounded-xl border border-gray-200 p-3 text-left transition hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg group-hover:scale-105 transition-transform">
                        👥
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{t('hrSupport')}</p>
                        <p className="truncate text-[11px] text-gray-500">{t('hrSupportSub')}</p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={openFullScreenChat}
                        className="text-xs font-medium text-primary-600 hover:underline"
                      >
                        {t('browseAllColleagues')} →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Recent Chats Tab */
                  <div className="space-y-2">
                    {conversations.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        <p>{t('noConversationsYet')}</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('direct')}
                          className="mt-2 text-xs font-medium text-primary-600 hover:underline"
                        >
                          {t('startChat')}
                        </button>
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const info = getRecipientInfo(conv);
                        const hasUnread = conv.unreadCount > 0;
                        return (
                          <button
                            key={conv._id}
                            type="button"
                            onClick={() => selectConversation(conv)}
                            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-gray-100/80"
                          >
                            <div className="relative shrink-0">
                              {info.isSupport ? (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-base">
                                  {info.avatar}
                                </span>
                              ) : info.avatar ? (
                                <img
                                  src={info.avatar}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                                  {info.initials}
                                </span>
                              )}
                              {info.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className={`truncate text-xs ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                    {info.name}
                                  </p>
                                  <span className={`shrink-0 rounded px-1 text-[8px] font-medium ${
                                    info.type === 'direct' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {info.type === 'direct' ? '1:1' : 'Team'}
                                  </span>
                                </div>
                                {conv.lastMessage?.createdAt && (
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>
                              <p className={`truncate text-[11px] ${hasUnread ? 'font-semibold text-primary-700' : 'text-gray-500'}`}>
                                {conv.lastMessage?.text || t('newConversation')}
                              </p>
                            </div>

                            {hasUnread && (
                              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                                {conv.unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsWidgetOpen((prev) => !prev)}
        aria-label={isWidgetOpen ? t('closeChat') : t('openChat')}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300"
      >
        {/* Unread badge on button */}
        {totalUnreadCount > 0 && !isWidgetOpen && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-md animate-pulse">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}

        {isWidgetOpen ? (
          <svg className="h-6 w-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
