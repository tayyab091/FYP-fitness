'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  initializeSocket,
  joinConversation,
  leaveConversation,
  emitTyping,
  emitStopTyping,
  emitMessageRead,
  getSocket,
} from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  CheckCheck,
  Check,
  Crown,
} from 'lucide-react';
import Link from 'next/link';


// ── Type Definitions ──
interface Participant {
  userId: { _id: string; fullName: string; profileImage?: string; role: string } | string;
  role: 'user' | 'trainer' | 'gym_owner';
  lastSeen?: Date;
  isTyping: boolean;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; fullName: string; profileImage?: string } | string;
  receiverId: { _id: string; fullName: string } | string;
  content: string;
  type: 'text' | 'image' | 'workout_plan' | 'meal_plan' | 'file';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  isFreeMessage?: boolean;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  trainerId: { _id: string; name: string; specialty: string } | string;
  isFreeChat: boolean;
  freeMessageCount: number;
  lastMessage?: { content: string; sentAt: Date; sentBy: string };
  unreadCount: { user: number; trainer: number };
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// ── API Helpers ──
const apiFetch = (url: string, opts?: RequestInit) =>
  fetch(`${url}`, { credentials: 'include', ...opts });

async function fetchConversations() {
  const res = await apiFetch('/api/chat/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

async function fetchMessages(conversationId: string) {
  const res = await apiFetch(`/api/chat/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

async function sendMessage(conversationId: string, content: string, trainerId: string) {
  const res = await apiFetch(`/api/chat/conversations/${conversationId}/messages?trainerId=${trainerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, type: 'text' }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send message');
  }
  return res.json();
}

async function startConversation(trainerId: string) {
  const res = await apiFetch(`/api/chat/start/${trainerId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    if (error.code === 'FREE_LIMIT_REACHED') {
      throw new Error('Free message limit reached. Upgrade to Pro for unlimited chat.');
    }
    throw new Error(error.error || 'Failed to start conversation');
  }
  return res.json();
}

function ChatContainer() {
  const { user, isLoading: authLoading } = useAuth() as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainerId = searchParams.get('trainerId');
  const queryClient = useQueryClient();

  // State
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const socket = getSocket();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // ── Queries ──
  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchConversations,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['chat-messages', selectedConvId],
    queryFn: () => (selectedConvId ? fetchMessages(selectedConvId) : Promise.resolve(null)),
    enabled: !!selectedConvId,
  });

  const conversations: Conversation[] = convsData?.data?.conversations || convsData?.data || [];
  const messages: Message[] = msgsData?.data?.messages || msgsData?.data || [];

  // ── Mutations ──
  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      const trainerId = selectedConv?.trainerId;
      const trainerId_str = typeof trainerId === 'object' ? trainerId._id : trainerId;
      return sendMessage(selectedConvId!, content, trainerId_str || '');
    },
    onSuccess: () => {
      setMessageInput('');
      setLimitError(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (err: any) => {
      if (err.message.includes('Free message limit')) {
        setLimitError(err.message);
      } else {
        setLimitError(err.message || 'Failed to send message');
      }
    },
  });

  const startMutation = useMutation({
    mutationFn: () => (trainerId ? startConversation(trainerId) : Promise.reject('No trainer ID')),
    onSuccess: (data) => {
      setSelectedConvId(data.data._id);
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (err: any) => {
      setLimitError(err.message || 'Failed to start conversation');
    },
  });

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Socket.IO Setup ──
  useEffect(() => {
    if (!user) return;

    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      initializeSocket(token);
    } else {
      console.warn('[Chat] No token found in cookies for socket initialization');
    }
  }, [user]);

  // ── Socket.IO Listeners ──
  useEffect(() => {
    if (!socket || !selectedConvId) return;

    // Join conversation room
    joinConversation(selectedConvId);
    emitMessageRead(selectedConvId, '');

    // Listen for new messages
    const onReceiveMessage = (data: any) => {
      if (data.conversationId === selectedConvId || data.message?.conversationId === selectedConvId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    };

    // Listen for typing
    const onUserTyping = (data: any) => {
      if (data.userId !== user?._id && data.userId !== user?.id) {
        setOtherUserTyping(true);
      }
    };

    const onUserStoppedTyping = () => {
      setOtherUserTyping(false);
    };

    socket.on('receive_message', onReceiveMessage);
    socket.on('new_message', onReceiveMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('new_message', onReceiveMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      leaveConversation(selectedConvId);
    };
  }, [socket, selectedConvId, user, queryClient]);

  // ── Typing Handler ──
  const handleTyping = useCallback(
    (value: string) => {
      setMessageInput(value);
      setLimitError(null);

      if (!socket || !selectedConvId) return;

      if (!isTyping) {
        setIsTyping(true);
        emitTyping(selectedConvId);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitStopTyping(selectedConvId);
      }, 1500);
    },
    [socket, selectedConvId, isTyping]
  );

  // ── Send Message Handler ──
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConvId) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      emitStopTyping(selectedConvId);
    }

    await sendMutation.mutateAsync(content);
  }, [messageInput, selectedConvId, isTyping, sendMutation]);

  // ── Get other participant ──
  const getOtherPerson = (conv: Conversation) => {
    const myId = user?._id || user?.id;
    const other = conv.participants.find(
      (p) => (typeof p.userId === 'object' ? p.userId._id : p.userId) !== myId
    )?.userId;
    return typeof other === 'object' ? other : null;
  };

  const selectedConv = conversations.find((c) => c._id === selectedConvId);
  const otherPerson = selectedConv ? getOtherPerson(selectedConv) : null;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Please log in to access chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* ── LEFT PANEL: Conversations ── */}
      <div
        className={`
          w-full md:w-80 flex-shrink-0 border-r border-border flex flex-col bg-card
          ${selectedConvId ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chats</h2>
          <p className="text-xs text-muted-foreground mt-1">Chat with trainers</p>
        </div>

        {/* Content */}
        {convsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <Link
              href="/coaching"
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Find a Trainer
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {conversations.map((conv) => {
              const other = getOtherPerson(conv);
              const myId = user?._id || user?.id;
              const isMe = user?.role === 'trainer';
              const unread = isMe ? conv.unreadCount?.trainer : conv.unreadCount?.user;
              const isSelected = conv._id === selectedConvId;

              return (
                <button
                  key={conv._id}
                  onClick={() => {
                    // Navigate to the conversation detail page
                    router.push(`/chat/${conv._id}`);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    hover:bg-secondary/50 transition-colors text-left
                    ${isSelected ? 'bg-secondary' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                      {other?.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{other?.fullName || 'Unknown'}</p>
                      {conv.lastMessage?.sentAt && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(conv.lastMessage.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Start conversation button if trainerId in URL */}
        {trainerId &&
          !conversations.some((c) => {
            const otherUid = c.participants.find(
              (p) =>
                (typeof p.userId === 'object' ? p.userId._id : p.userId) !== (user?._id || user?.id)
            )?.userId;
            const otherId = typeof otherUid === 'object' ? otherUid._id : otherUid;
            return otherId?.toString() === trainerId;
          }) && (
          <div className="p-4 border-t border-border">
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {startMutation.isPending ? 'Starting...' : 'Start Chat'}
            </button>
            {limitError && <p className="text-xs text-destructive mt-2">{limitError}</p>}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Chat Window ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}
      >
        {!selectedConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <MessageSquare className="w-16 h-16 text-muted-foreground/20" />
            <p className="text-lg font-semibold">Select a conversation</p>
            <p className="text-sm text-muted-foreground">Choose a chat to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
              <button
                onClick={() => setSelectedConvId(null)}
                className="md:hidden p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {otherPerson && (
                <>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                    {otherPerson?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{otherPerson?.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{otherPerson?.role}</p>
                  </div>

                  {/* Free chat badge */}
                  {selectedConv?.isFreeChat && (
                    <span className="text-[10px] bg-yellow-500/15 text-yellow-700 border border-yellow-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                      <Crown className="w-3 h-3" />
                      Free: {selectedConv?.freeMessageCount || 0}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((msg, idx) => {
                      const myId = user?._id || user?.id;
                      const senderId =
                        typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                      const isMine =
                        senderId === myId || senderId?.toString() === myId?.toString();

                      return (
                        <motion.div
                           key={msg._id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words
                              ${
                                isMine
                                  ? 'bg-primary text-primary-foreground rounded-br-none'
                                  : 'bg-secondary text-secondary-foreground rounded-bl-none'
                              }
                            `}
                          >
                            <p>{msg.content}</p>
                            <div
                              className={`
                                flex items-center gap-1 mt-1 text-[10px]
                                ${
                                  isMine
                                    ? 'justify-end text-primary-foreground/60'
                                    : 'justify-start text-muted-foreground'
                                }
                              `}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMine &&
                                (msg.isRead ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3 opacity-50" />
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {otherUserTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-secondary px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-muted-foreground rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {limitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-3 bg-destructive/10 border-t border-destructive/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-destructive">{limitError}</p>
                      {limitError.includes('upgrade') && (
                        <Link
                          href="/subscription"
                          className="text-xs text-primary underline hover:text-primary/90 mt-1 inline-block"
                        >
                          Upgrade to Pro →
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none bg-secondary border-0 rounded-2xl px-4 py-3 text-sm
                    placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20
                    max-h-32 overflow-y-auto"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="w-11 h-11 bg-primary hover:bg-primary/90 text-primary-foreground
                    rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] bg-background items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatContainer />
    </Suspense>
  );
}
