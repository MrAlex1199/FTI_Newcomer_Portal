import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';
import useAuth from '../hooks/useAuth.js';
import useChat from '../hooks/useChat.js';
import useLanguage from '../hooks/useLanguage.js';
import chatService from '../services/chatService.js';

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
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'direct' | 'support'
  const [colleagueModalOpen, setColleagueModalOpen] = useState(false);
  const [colleagueSearch, setColleagueSearch] = useState('');
  const [colleagueResults, setColleagueResults] = useState([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal;
    setInputVal('');
    stopTyping();
    await sendMessage(text);
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
      department: other.employeeId?.departmentId?.name || '',
    };
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (typeFilter === 'direct') {
      list = list.filter((c) => c.type === 'direct');
    } else if (typeFilter === 'support') {
      list = list.filter((c) => c.type === 'support' || c.type === 'group');
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

  return (
    <AppShell>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">{t('dashboard')} / {t('chat')}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{t('chatTitle')}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setColleagueModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {t('newChat')} ({t('directChatBadge')})
          </button>
        </div>
      </div>

      {/* Main Chat Hub Container */}
      <div className="grid h-[calc(100vh-13.5rem)] min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[330px_1fr]">
        {/* Left Sidebar: Conversations & Support Shortcuts */}
        <div className={`flex flex-col border-r border-gray-200 bg-slate-50/50 ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search bar & quick filter */}
          <div className="p-3.5 border-b border-gray-200 space-y-2.5 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchColleaguePlaceholder')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Tabs (All / Direct 1-on-1 / Teams & Support) */}
            <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`flex-1 rounded-md py-1.5 transition text-center ${
                  typeFilter === 'all'
                    ? 'bg-white font-bold text-primary-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('direct')}
                className={`flex-1 rounded-md py-1.5 transition text-center ${
                  typeFilter === 'direct'
                    ? 'bg-white font-bold text-primary-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                👤 1-on-1
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('support')}
                className={`flex-1 rounded-md py-1.5 transition text-center ${
                  typeFilter === 'support'
                    ? 'bg-white font-bold text-primary-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                👥 ทีม/กลุ่ม
              </button>
            </div>

            {/* Quick Support Shortcuts */}
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => openSupportChat('it')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/70 py-1.5 px-2 text-[11px] font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                <span>💻</span> {t('itHelpdeskSupport')}
              </button>
              <button
                type="button"
                onClick={() => openSupportChat('hr')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/70 py-1.5 px-2 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <span>👥</span> {t('hrSupport')}
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadingConversations ? (
              <div className="p-6 text-center text-xs text-gray-400">{t('loading')}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-500">{t('noConversationsYet')}</p>
                <button
                  type="button"
                  onClick={() => setColleagueModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
                >
                  {t('findColleagues')}
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
                    className={`flex w-full items-center gap-3 p-3 text-left transition ${
                      isSelected
                        ? 'bg-primary-50/70 border-l-4 border-primary-600'
                        : 'hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {info.isSupport ? (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-lg shadow-sm">
                          {info.avatar}
                        </span>
                      ) : info.avatar ? (
                        <img
                          src={info.avatar}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm">
                          {info.initials}
                        </span>
                      )}
                      {info.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`truncate text-xs ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                            {info.name}
                          </p>
                          <span className={`shrink-0 rounded px-1 py-0.2 text-[9px] font-medium ${
                            info.type === 'direct'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {info.type === 'direct' ? '1:1' : 'Team'}
                          </span>
                        </div>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`truncate text-[11px] mt-0.5 ${hasUnread ? 'font-semibold text-primary-700' : 'text-gray-500'}`}>
                        {conv.lastMessage?.text || t('newConversation')}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className={`flex flex-col bg-slate-50/30 ${!activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Active Header */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => selectConversation(null)}
                    className="mr-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
                    title={t('back')}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="relative shrink-0">
                    {currentInfo.isSupport ? (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg">
                        {currentInfo.avatar}
                      </span>
                    ) : currentInfo.avatar ? (
                      <img
                        src={currentInfo.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                        {currentInfo.initials}
                      </span>
                    )}
                    {currentInfo.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900 leading-tight">
                        {currentInfo.name}
                      </h2>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        currentInfo.type === 'direct'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {currentInfo.typeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {currentInfo.isOnline ? (
                        <span className="font-medium text-green-600">● {t('online')}</span>
                      ) : (
                        <span className="text-gray-400">{t('offline')}</span>
                      )}
                      {currentInfo.role && ` • ${currentInfo.role}`}
                      {currentInfo.department && ` (${currentInfo.department})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    {t('loadingMessages')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6">
                    <span className="text-4xl mb-2">👋</span>
                    <p className="text-sm font-semibold text-gray-700">{t('startNewChatPrompt')}</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">{t('typeMessagePlaceholder')}</p>
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
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                          {!isMe && (
                            <div className="h-7 w-7 rounded-full bg-primary-100 shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-primary-700 border border-primary-200">
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
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-none'
                            }`}
                          >
                            {/* Prominently show sender's name on group/support chats or when sender is someone else */}
                            {!isMe && (
                              <div className="mb-1 flex items-center gap-1.5 border-b border-gray-100/90 pb-1">
                                <span className="text-xs font-bold text-primary-700">
                                  {senderName}
                                </span>
                                {senderRole && (
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    • {senderRole}
                                  </span>
                                )}
                                {activeConversation?.type !== 'direct' && (
                                  <span className="ml-auto rounded bg-primary-50 px-1.5 py-0.2 text-[9px] font-semibold text-primary-700 border border-primary-100">
                                    {activeConversation?.type === 'support' ? t('supportChatBadge') : t('groupChatBadge')}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>

                        <span className={`mt-1 px-1 text-[10px] text-gray-400 ${isMe ? 'mr-1' : 'ml-9'}`}>
                          {timeStr}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {activeTypingUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 italic px-2">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>{activeTypingUsers.join(', ')} {t('isTyping')}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-3 border-t border-gray-200 bg-white p-3 sm:p-4"
              >
                <textarea
                  rows={1}
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('typeMessagePlaceholder')}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-xs sm:text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-40 transition"
                >
                  <span>{t('sendMessage')}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected on desktop */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-3xl text-primary-600 shadow-inner">
                💬
              </div>
              <h2 className="text-lg font-bold text-gray-800">{t('ftiChatSupport')}</h2>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                {t('ftiHelpdeskDesc')}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setColleagueModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
                >
                  <span>👤</span> {t('searchColleagueHelp')}
                </button>
                <button
                  type="button"
                  onClick={() => openSupportChat('it')}
                  className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs font-semibold text-indigo-900 transition hover:bg-indigo-100"
                >
                  <span>💻</span> {t('itHelpdeskSupport')}
                </button>
                <button
                  type="button"
                  onClick={() => openSupportChat('hr')}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <span>👥</span> {t('hrSupport')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Start Chat with Colleague Modal */}
      <Modal
        open={colleagueModalOpen}
        onClose={() => setColleagueModalOpen(false)}
        title={`${t('findColleagues')} (${t('directChatBadge')})`}
        size="md"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={colleagueSearch}
            onChange={(e) => setColleagueSearch(e.target.value)}
            placeholder={t('searchColleaguePlaceholder')}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {loadingColleagues ? (
              <div className="py-6 text-center text-xs text-gray-400">{t('loading')}</div>
            ) : colleagueResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                {colleagueSearch ? t('noResults') : t('startTypingSearch')}
              </div>
            ) : (
              colleagueResults.map((u) => {
                const emp = u.employeeId || u.internId || {};
                const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || u.username;
                const pos = emp.position || u.role;
                const dept = emp.departmentId?.name || '';
                const isOnline = isUserOnline(u._id);

                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {emp.profileImage ? (
                          <img
                            src={emp.profileImage}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                            {name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{name}</p>
                        <p className="text-[11px] text-gray-500">
                          {pos} {dept && `• ${dept}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startDirectWithUser(u)}
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition"
                    >
                      {t('startChat')}
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
