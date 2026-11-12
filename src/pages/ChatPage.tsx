
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Mic, Pause, Play, Send, Smile, Trash2 } from 'lucide-react';
import { chatApi, type ChatContact, type ChatInboxItem, type ChatMessage, type ChatRetentionPeriod } from '../api/chat';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportContentButton } from '../components/ReportContentButton';

type Mode = 'group' | 'direct';

const EMOJI = ['😀', '😂', '🥹', '😊', '😍', '👍', '👏', '🙏', '❤️', '🎉', '🔥', '💯'];

const STICKERS = [
  { id: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { id: 'thank-you', emoji: '🙏', label: 'Thank you' },
  { id: 'well-done', emoji: '👏', label: 'Well done' },
  { id: 'studying', emoji: '📚', label: 'Studying' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking' },
  { id: 'laughing', emoji: '😂', label: 'Laughing' },
  { id: 'encouragement', emoji: '💪', label: 'You got this' },
  { id: 'hello', emoji: '👋', label: 'Hello' },
];

function playSophisTone(kind: 'send' | 'receive') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const now = context.currentTime;

    const notes =
      kind === 'send'
        ? [
            { f: 659.25, t: 0, d: 0.075 },
            { f: 987.77, t: 0.065, d: 0.11 },
          ]
        : [
            { f: 783.99, t: 0, d: 0.09 },
            { f: 587.33, t: 0.085, d: 0.13 },
          ];

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.0001, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.11, now + note.t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now + note.t);
      oscillator.stop(now + note.t + note.d + 0.015);
    }

    window.setTimeout(() => {
      void context.close();
    }, 500);
  } catch {
    // Sound must never interrupt messaging.
  }
}

function VoiceMessagePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // A compact waveform-style frequency signal. Its played portion follows
  // the audio element's actual playback position.
  const bars = Array.from({ length:  40 }, (_, index) => {
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin(index * 0.47) * Math.cos(index * 0.19));
    return Math.round(5 + envelope * 19);
  });
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="flex w-full min-w-0 max-w-[280px] items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
        onDurationChange={event => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={() => void togglePlayback()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-violet-800 transition hover:bg-white dark:bg-[#26314A] dark:text-[#D8CCFF] dark:hover:bg-[#334155]"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        title={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="flex h-8 min-w-0 w-full items-center gap-[2px] overflow-hidden"
          role="img"
          aria-label={`Voice message waveform, ${formatTime(currentTime)} of ${formatTime(duration)} played`}
        >
          {bars.map((height, index) => (
            <span
              key={index}
              className={`h-auto min-w-0 max-w-[3px] flex-1 rounded-full transition-colors duration-100 ${
                index / bars.length <= progress
                  ? 'bg-violet-700 dark:bg-violet-300'
                  : 'bg-violet-300 dark:bg-[#94A3B8]'
              }`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-medium tabular-nums text-violet-800 dark:text-[#D8CCFF]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const mode: Mode =
    location.pathname === '/chat/group' && user?.role === 'student'
      ? 'group'
      : 'direct';

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [inbox, setInbox] = useState<ChatInboxItem[]>([]);
  const knownInboxMessageIdsRef = useRef<Set<string> | null>(null);
  const [onlineContactIds, setOnlineContactIds] = useState<Set<string>>(() => new Set());

  const [recipient, setRecipient] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [contactSearchError, setContactSearchError] = useState('');

  const contactSearchSequenceRef = useRef(0);

  const selectedContact = contacts.find(contact => contact.id === recipient);
  const recipientDeleted = Boolean(selectedContact?.isDeleted);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [retentionPeriod, setRetentionPeriod] = useState<ChatRetentionPeriod>('90_days');
  const [savingRetention, setSavingRetention] = useState(false);
  const [hiddenDeletedMessageIds, setHiddenDeletedMessageIds] = useState<Set<string>>(() => new Set());
  const [expandedDeletedMessageId, setExpandedDeletedMessageId] = useState<string | null>(null);
  const visibleMessages = messages.filter(message => !hiddenDeletedMessageIds.has(message.id));
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Keep unsent drafts separate so switching between private DM and group chat
  // never carries text from one conversation mode into the other.
  const [drafts, setDrafts] = useState<Record<Mode, string>>({
    group: '',
    direct: '',
  });

  const text = drafts[mode];

  const setText = (value: string | ((current: string) => string)) => {
    setDrafts(current => ({
      ...current,
      [mode]: typeof value === 'function' ? value(current[mode]) : value,
    }));
  };

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardSearch, setForwardSearch] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<
    Array<{ userId: string; academicHandle: string | null }>
  >([]);

  const [mutedGroup, setMutedGroup] = useState(() => {
    try {
      return window.localStorage.getItem('sophis-chat-muted-group') === 'true';
    } catch {
      return false;
    }
  });

  const [mutedDirect, setMutedDirect] = useState(() => {
    try {
      return window.localStorage.getItem('sophis-chat-muted-direct') === 'true';
    } catch {
      return false;
    }
  });

  const [recording, setRecording] = useState(false);

  const [voicePreview, setVoicePreview] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState('');
  const [voicePreviewTarget, setVoicePreviewTarget] = useState<{
    mode: Mode;
    pathname: string;
    recipientId: string | null;
  } | null>(null);
  const recordingTargetRef = useRef<{
    mode: Mode;
    pathname: string;
    recipientId: string | null;
  } | null>(null);
  const previewBelongsToCurrentChat = Boolean(
    voicePreview &&
      voicePreviewTarget &&
      voicePreviewTarget.mode === mode &&
      voicePreviewTarget.pathname === location.pathname &&
      voicePreviewTarget.recipientId === (mode === 'direct' ? recipient || null : null),
  );
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const [waveform, setWaveform] = useState<number[]>(
    Array.from({ length: 36 }, () => 3),
  );

  const listRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const micHeldRef = useRef(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformFrameRef = useRef<number | null>(null);

  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const requestSequenceRef = useRef(0);
  const knownMessageIdsRef = useRef<Set<string> | null>(null);

  const activeConversationRef = useRef(`${mode}:${recipient}`);
  activeConversationRef.current = `${mode}:${recipient}`;

  useEffect(() => {
    if (!selectedMessage && !forwardDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMessage(null);
        setForwardDialogOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedMessage, forwardDialogOpen]);

  useEffect(() => () => {
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
  }, []);

  const loadPresence = useCallback(async () => {
    try {
      const result = await chatApi.presence();
      setOnlineContactIds(new Set(result.filter(item => item.online).map(item => item.id)));
    } catch {
      // Presence is supplementary.
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try {
      setBlockedUsers(await chatApi.blocks());
    } catch {
      // Block controls remain unavailable if the request fails.
    }
  }, []);

  const loadContacts = useCallback(async (search = '') => {
    const sequence = ++contactSearchSequenceRef.current;
    if (!search.trim()) {
      setContacts([]);
      setContactSearchLoading(false);
      setContactSearchError('');
      return;
    }

    setContactSearchLoading(true);
    setContactSearchError('');

    try {
      const result = await chatApi.contacts(search);

      if (sequence !== contactSearchSequenceRef.current) return;

      setContacts(Array.isArray(result) ? result : []);
    } catch (e) {
      if (sequence === contactSearchSequenceRef.current) {
        setContacts([]);
        setContactSearchError(
          e instanceof Error ? e.message : 'Could not search users. Please try again.',
        );
      }
    } finally {
      if (sequence === contactSearchSequenceRef.current) {
        setContactSearchLoading(false);
      }
    }
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      const result = await chatApi.inbox();
      const nextInbox = Array.isArray(result) ? result : [];
      const previousIds = knownInboxMessageIdsRef.current;

      const incoming = previousIds
        ? nextInbox.filter(item =>
            !item.lastMessage.isOwn && !previousIds.has(item.lastMessage.id),
          )
        : [];

      const hasUnfocusedIncoming = incoming.some(
        item => mode !== 'direct' || recipient !== item.contact.id,
      );

      if (hasUnfocusedIncoming && !mutedDirect) {
        playSophisTone('receive');
      }

      knownInboxMessageIdsRef.current = new Set(
        nextInbox.map(item => item.lastMessage.id),
      );
      setInbox(nextInbox);
    } catch {
      // Keep the conversation composer usable if inbox summaries are temporarily unavailable.
    }
  }, [mode, recipient, mutedDirect]);

  const loadMessages = useCallback(
    async (quiet = false) => {
      const requestSequence = quiet
        ? requestSequenceRef.current
        : ++requestSequenceRef.current;

      if (!quiet) setLoading(true);

      try {
        const result =
          mode === 'group'
            ? await chatApi.groupHistory()
            : recipient
              ? await chatApi.directHistory(recipient)
              : { items: [], hasMore: false, nextBefore: null, retentionPeriod: '90_days' as const };

        if (requestSequence !== requestSequenceRef.current) return;
        if (mode === 'direct') setRetentionPeriod(result.retentionPeriod ?? '90_days');
        setHiddenDeletedMessageIds(new Set(result.hiddenMessageIds ?? []));

        if (quiet) {
          const container = listRef.current;

          shouldAutoScrollRef.current =
            !!container &&
            container.scrollHeight - container.scrollTop - container.clientHeight < 100;

          const incoming = (result.items ?? []).filter(
            message =>
              !message.isOwn &&
              !message.isDeleted &&
              knownMessageIdsRef.current?.has(message.id) === false,
          );

          if (
            knownMessageIdsRef.current &&
            incoming.length &&
            !((mode === 'group' && mutedGroup) || (mode === 'direct' && mutedDirect))
          ) {
            playSophisTone('receive');
          }

          if (mode === 'direct' && recipient && incoming.length) {
            void chatApi.markRead(recipient).then(loadInbox).catch(() => undefined);
          }

          setMessages(current => {
            const merged = new Map(current.map(message => [message.id, message]));

            for (const message of result.items ?? []) {
              merged.set(message.id, message);
            }

            return [...merged.values()].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
          });

          if (!knownMessageIdsRef.current) {
            knownMessageIdsRef.current = new Set();
          }

          for (const message of result.items ?? []) {
            knownMessageIdsRef.current.add(message.id);
          }
        } else {
          setMessages(result.items ?? []);

          knownMessageIdsRef.current = new Set(
            (result.items ?? []).map(message => message.id),
          );

          setHasMore(result.hasMore ?? false);
          setNextBefore(result.nextBefore ?? null);

          if (mode === 'direct' && recipient) {
            void chatApi.markRead(recipient).then(loadInbox).catch(() => undefined);
          }
        }

        setError('');
      } catch (e) {
        if (requestSequence === requestSequenceRef.current) {
          setError(e instanceof Error ? e.message : 'Could not load messages.');
        }
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    },
    [mode, recipient, mutedGroup, mutedDirect, loadInbox],
  );

  const changeRetention = async (period: ChatRetentionPeriod) => {
    if (!recipient || savingRetention || recipientDeleted) return;
    setSavingRetention(true);
    setError('');
    try {
      const updated = await chatApi.updateDirectRetention(recipient, period);
      setRetentionPeriod(updated.retentionPeriod);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update disappearing messages.');
    } finally {
      setSavingRetention(false);
    }
  };

  const loadOlder = async () => {
    if (!hasMore || !nextBefore || loadingOlder || !listRef.current) return;

    const container = listRef.current;
    const requestSequence = requestSequenceRef.current;
    const conversationKey = `${mode}:${recipient}`;

    preserveScrollRef.current = {
      height: container.scrollHeight,
      top: container.scrollTop,
    };

    setLoadingOlder(true);

    try {
      const result =
        mode === 'group'
          ? await chatApi.groupHistory(40, nextBefore)
          : await chatApi.directHistory(recipient, 40, nextBefore);

      if (
        requestSequence !== requestSequenceRef.current ||
        conversationKey !== activeConversationRef.current
      ) {
        preserveScrollRef.current = null;
        return;
      }

      setMessages(current => {
        const known = new Set(current.map(message => message.id));

        return [
          ...(result.items ?? []).filter(message => !known.has(message.id)),
          ...current,
        ];
      });

      setHasMore(result.hasMore ?? false);
      setNextBefore(result.nextBefore ?? null);
    } catch (e) {
      if (
        requestSequence === requestSequenceRef.current &&
        conversationKey === activeConversationRef.current
      ) {
        preserveScrollRef.current = null;
        setError(e instanceof Error ? e.message : 'Could not load older messages.');
      }
    } finally {
      if (conversationKey === activeConversationRef.current) {
        setLoadingOlder(false);
      }
    }
  };

  useEffect(() => {
    void loadBlocks();
    void loadInbox();
  }, [loadBlocks, loadInbox]);
  useEffect(() => {
    const query = contactSearch.trim();
    // Invalidate an older in-flight search immediately when the query changes.
    contactSearchSequenceRef.current += 1;
    if (!query) {
      setContacts([]);
      setContactSearchLoading(false);
      setContactSearchError('');
      setShowContactDropdown(false);
      return;
    }

    setContacts([]);
    setContactSearchLoading(true);
    setContactSearchError('');

    const timer = window.setTimeout(() => {
      void loadContacts(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [contactSearch, loadContacts]);

  useEffect(() => {
    try {
      window.localStorage.setItem('sophis-chat-muted-group', String(mutedGroup));
    } catch {
      // Preference is optional.
    }
  }, [mutedGroup]);

  useEffect(() => {
    try {
      window.localStorage.setItem('sophis-chat-muted-direct', String(mutedDirect));
    } catch {
      // Preference is optional.
    }
  }, [mutedDirect]);

  useEffect(() => {
    let active = true;

    const sendHeartbeat = async () => {
      try {
        await chatApi.heartbeat();
      } catch {
        // A missed heartbeat simply expires.
      }

      if (active) void loadPresence();
    };

    void sendHeartbeat();

    const timer = window.setInterval(() => {
      void sendHeartbeat();
    }, 25000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadPresence]);

  useEffect(() => {
    setRecipient('');
    setShowContactDropdown(false);
    setShowEmoji(false);
    setShowStickers(false);
  }, [location.pathname, user?.role]);

  // Notification links can open a specific private conversation directly.
  useEffect(() => {
    const userId = new URLSearchParams(location.search).get('userId');
    if (!userId) return;

    setRecipient(userId);
    setContactSearch('');
    setShowContactDropdown(false);
    setError('');
  }, [location.search]);

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setNextBefore(null);
    setLoadingOlder(false);

    preserveScrollRef.current = null;

    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    return chatApi.subscribe(() => {
      void loadMessages(true);
      void loadInbox();
    });
  }, [loadMessages, loadInbox]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadMessages(true);
      void loadInbox();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadMessages, loadInbox]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    if (preserveScrollRef.current) {
      const previous = preserveScrollRef.current;

      container.scrollTop =
        previous.top + (container.scrollHeight - previous.height);

      preserveScrollRef.current = null;
    } else if (shouldAutoScrollRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });

      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  const send = async () => {
    const value = text.trim();

    if (
      !value ||
      sending ||
      (mode === 'direct' && (!recipient || recipientDeleted))
    ) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const message = await chatApi.sendText(
        mode,
        value,
        mode === 'direct' ? recipient : undefined,
        replyTarget?.id,
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);
      void loadInbox();
      setText('');
      setReplyTarget(null);
      setShowEmoji(false);

      playSophisTone('send');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (stickerId: string) => {
    if (
      sending ||
      (mode === 'direct' && (!recipient || recipientDeleted))
    ) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const message = await chatApi.sendSticker(
        mode,
        stickerId,
        mode === 'direct' ? recipient : undefined,
        replyTarget?.id,
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);
      setReplyTarget(null);
      void loadInbox();
      setShowStickers(false);

      playSophisTone('send');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sticker could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      const updated = await chatApi.edit(id, editText);

      setMessages(current =>
        current.map(message => (message.id === id ? updated : message)),
      );

      setEditing(null);
      setEditText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message could not be edited.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await chatApi.remove(id);
      await loadMessages(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message could not be deleted.');
    }
  };

  const hideDeletedMessage = async (id: string) => {
    try {
      await chatApi.hideDeletedMessage(id);
      setHiddenDeletedMessageIds(current => new Set([...current, id]));
      setMessages(current => current.filter(message => message.id !== id));
      setExpandedDeletedMessageId(null);
      await loadInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deleted message could not be removed from your chat.');
    }
  };

  const releaseRecordingResources = () => {
    if (waveformFrameRef.current !== null) {
      cancelAnimationFrame(waveformFrameRef.current);
    }

    waveformFrameRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    analyserRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== 'closed') {
      void context.close();
    }
  };

  const animateWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const values = new Uint8Array(analyser.frequencyBinCount);
    let lastPaint = 0;

    const draw = (time: number) => {
      if (!analyserRef.current) return;

      if (time - lastPaint >= 75) {
        analyser.getByteFrequencyData(values);

        const bars = Array.from({ length: 36 }, (_, index) => {
          const value = values[Math.floor((index * values.length) / 36)] ?? 0;

          return Math.max(3, Math.min(28, Math.round((value / 255) * 28)));
        });

        setWaveform(bars);
        lastPaint = time;
      }

      waveformFrameRef.current = requestAnimationFrame(draw);
    };

    waveformFrameRef.current = requestAnimationFrame(draw);
  };

  const startRecording = async () => {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Microphone access requires a secure browser connection. Open Sophis Central directly at https://sophiscentral.vercel.app and try again.',
        );
      }

      setError('');

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }

      setVoicePreview(null);
      setVoicePreviewUrl('');
      setVoicePreviewTarget(null);
      setPreviewPlaying(false);
      recordingTargetRef.current = {
        mode,
        pathname: location.pathname,
        recipientId: mode === 'direct' ? recipient || null : null,
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      streamRef.current = stream;

      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg',
      ].find(type => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      const chunks: BlobPart[] = [];

      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();

        analyser.fftSize = 128;

        context.createMediaStreamSource(stream).connect(analyser);

        audioContextRef.current = context;
        analyserRef.current = analyser;

        void context.resume();
      }

      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });

        releaseRecordingResources();

        setRecording(false);
        setWaveform(Array.from({ length: 36 }, () => 3));

        if (!blob.size) return;

        if (blob.size > 12 * 1024 * 1024) {
          setError('Recording exceeds the 12 MB limit. Please record a shorter message.');
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const target = recordingTargetRef.current;

        if (!target) {
          URL.revokeObjectURL(previewUrl);
          return;
        }

        setVoicePreview(blob);
        setVoicePreviewUrl(previewUrl);
        setVoicePreviewTarget(target);
        recordingTargetRef.current = null;
      };

      recorderRef.current = recorder;

      recorder.start();

      setRecording(true);

      animateWaveform();

      if (!micHeldRef.current) {
        window.setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 0);
      }
    } catch (e) {
      const errorName = e instanceof DOMException ? e.name : '';

      if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        errorName === 'SecurityError'
      ) {
        setError(
          'Microphone permission was denied. Allow microphone access for sophiscentral.vercel.app in your browser or device site settings, then reload this page and try again.',
        );
      } else {
        setError(
          e instanceof Error
            ? e.message
            : 'Microphone access was not available. Check your device microphone and browser permissions.',
        );
      }
    }
  };

  const finishRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state !== 'inactive'
    ) {
      recorderRef.current.stop();
    }
  };

  // The recording UI replaces the microphone button, so listen on window as well
  // to reliably finish when the user releases outside the now-unmounted button.
  useEffect(() => {
    const handlePointerRelease = () => {
      if (!micHeldRef.current) return;
      micHeldRef.current = false;
      finishRecording();
    };

    window.addEventListener('pointerup', handlePointerRelease);
    window.addEventListener('pointercancel', handlePointerRelease);
    window.addEventListener('mouseup', handlePointerRelease);
    window.addEventListener('touchend', handlePointerRelease);
    window.addEventListener('touchcancel', handlePointerRelease);

    return () => {
      window.removeEventListener('pointerup', handlePointerRelease);
      window.removeEventListener('pointercancel', handlePointerRelease);
      window.removeEventListener('mouseup', handlePointerRelease);
      window.removeEventListener('touchend', handlePointerRelease);
      window.removeEventListener('touchcancel', handlePointerRelease);
    };
  }, []);

  const discardVoicePreview = () => {
    const audio = previewAudioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);

    setVoicePreview(null);
    setVoicePreviewUrl('');
    setVoicePreviewTarget(null);
    setPreviewPlaying(false);
  };

  const toggleVoicePreview = async () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setPreviewPlaying(true);
      } catch {
        setError('Could not play the voice preview. Please try again.');
      }
    } else {
      audio.pause();
      setPreviewPlaying(false);
    }
  };

  const sendVoicePreview = async () => {
    if (
      !voicePreview ||
      !previewBelongsToCurrentChat ||
      sending ||
      (mode === 'direct' && (!recipient || recipientDeleted))
    ) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const mime = voicePreview.type.split(';')[0] || 'audio/webm';

      const upload = await chatApi.voiceUpload(mime, voicePreview.size);

      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': upload.contentType,
        },
        body: voicePreview,
      });

      if (!response.ok) {
        throw new Error('Voice upload failed. Please try again.');
      }

      const message = await chatApi.sendVoice(
        mode,
        upload.key,
        mode === 'direct' ? recipient : undefined,
        replyTarget?.id,
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);
      setReplyTarget(null);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }

      setVoicePreview(null);
      setVoicePreviewUrl('');
      setVoicePreviewTarget(null);
      setPreviewPlaying(false);

      playSophisTone('send');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Voice message could not be sent.',
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(
    () => () => {
      if (
        recorderRef.current?.state !== 'inactive' &&
        recorderRef.current
      ) {
        recorderRef.current.stop();
      }

      releaseRecordingResources();

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }
    },
    [voicePreviewUrl],
  );

  if (user?.role !== 'student' && user?.role !== 'lecturer') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Chat is available to students and lecturers only.
      </div>
    );
  }

  return (
    <section className="chat-page mx-auto flex h-[calc(100vh-110px)] min-h-[640px] max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white text-[#091F5B] shadow-sm dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      {/* Chat header */}
      <div data-chat-desktop-header className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-200 bg-violet-100 p-4 dark:border-[#334155] dark:bg-[#0F172A] lg:dark:border-violet-200 lg:dark:bg-violet-100">
        <div>
          <h2 data-chat-desktop-header-title className="font-bold text-[#091F5B] dark:!text-white lg:dark:!text-violet-950">
            {mode === 'group' ? 'Group chat room' : 'Private DM'}
          </h2>

          <p data-chat-desktop-header-subtitle className="text-xs text-[#4B5563] dark:text-[#CBD5E1] lg:dark:text-violet-900">
            {mode === 'group'
              ? 'Your institution, faculty and department community'
              : 'Institution-wide private conversations across all faculties and departments'}
          </p>

          <button
            type="button"
            onClick={() =>
              mode === 'group'
                ? setMutedGroup(value => !value)
                : setMutedDirect(value => !value)
            }
            className="mt-2 rounded-lg border border-[#D7DEEA] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] transition-colors hover:bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2C36D9]/20 dark:border-[#475569] dark:bg-[#172033] dark:text-[#F1F5F9] dark:hover:bg-[#26314A]"
          >
            {(mode === 'group' ? mutedGroup : mutedDirect)
              ? 'Unmute notifications'
              : 'Mute notifications'}
          </button>
        </div>
      </div>

      {mode === 'direct' && !recipient && (
        <div data-chat-desktop-recent-panel className="border-b border-[#DCE4EF] bg-[#F3F6FC] px-4 py-3 dark:border-[#334155] dark:bg-[#0B1120] lg:dark:border-violet-200 lg:dark:bg-violet-100">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 data-chat-desktop-recent-heading className="text-xs font-bold uppercase tracking-wide text-[#1F2937] dark:text-[#E2E8F0] lg:dark:text-violet-950">
              Recent conversations
            </h3>
            <span className="text-[10px] text-[#71809A] dark:text-[#94A3B8] lg:dark:text-violet-800">
              {inbox.length} conversation{inbox.length === 1 ? '' : 's'}
            </span>
          </div>

          {inbox.length ? (
            <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
              {inbox.map(item => (
                <button
                  key={item.contact.id}
                  type="button"
                  onClick={() => {
                    setRecipient(item.contact.id);
                    setContactSearch('');
                    setShowContactDropdown(false);
                    setError('');
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    recipient === item.contact.id
                      ? 'bg-violet-100 dark:bg-[#31234B] lg:dark:bg-violet-200'
                      : 'bg-violet-50 hover:bg-[#F3F0FF] dark:bg-[#0F172A] dark:hover:bg-[#26314A] lg:dark:bg-violet-50 lg:dark:hover:bg-violet-200'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span data-chat-desktop-recent-username className="truncate text-xs font-semibold text-[#091F5B] dark:!text-white lg:dark:!text-violet-950">
                        {item.contact.isDeleted ? 'Deleted user' : `@${item.contact.academicHandle}`}
                      </span>
                      {item.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-violet-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </span>
                      )}
                    </span>
                    <span data-chat-desktop-recent-preview className="mt-0.5 block truncate text-[11px] text-[#4B5563] dark:text-[#CBD5E1] lg:dark:text-violet-900">
                      {item.lastMessage.isOwn ? 'You: ' : ''}{item.lastMessage.preview}
                    </span>
                  </span>
                  <time className="shrink-0 text-[10px] text-[#71809A] dark:text-[#94A3B8] lg:dark:text-violet-800">
                    {new Date(item.lastMessage.createdAt).toLocaleDateString()}
                  </time>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white px-3 py-3 text-center text-xs text-[#71809A] dark:bg-[#0F172A] dark:text-[#94A3B8]">
              Your private conversations will appear here when you send or receive messages.
            </p>
          )}
        </div>
      )}

      {/* Private conversation search */}
      {mode === 'direct' && !recipient && (
        <div className="border-b border-[#DCE4EF] bg-white px-4 py-3 dark:border-[#334155] dark:bg-[#0F172A]">
          <label
            className="mb-1 block text-xs font-semibold text-[#1F2937] dark:text-[#E2E8F0]"
            htmlFor="chat-contact-search"
          >
            Find a student or lecturer at your institution
          </label>

          <input
            id="chat-contact-search"
            type="search"
            value={contactSearch}
            onFocus={() => setShowContactDropdown(Boolean(contactSearch.trim()))}
            onChange={event => {
              const value = event.target.value;
              setContactSearch(value);
              setShowContactDropdown(Boolean(value.trim()));
            }}
            placeholder="Search your institution by username (e.g. @username)"
            className="chat-search-input mb-2 w-full rounded-xl border border-[#D7DEEA] bg-[#F3F6FC] px-3 py-2.5 text-sm text-[#091F5B] outline-none placeholder:text-[#71809A] focus:border-[#2C36D9] focus:ring-2 focus:ring-[#2C36D9]/20 dark:border-[#475569] dark:bg-[#172033] dark:text-white dark:placeholder:text-[#94A3B8] dark:focus:border-[#8B7AE8]"
          />

          {showContactDropdown && contactSearch.trim() && (
            <div
              className="max-h-36 overflow-y-auto rounded-xl border border-[#DCE4EF] bg-white dark:border-[#475569] dark:bg-[#172033]"
              role="listbox"
              aria-label="Available private conversations"
            >
              {contactSearchLoading ? (
                <p className="px-3 py-4 text-center text-xs text-[#4B5563] dark:text-[#CBD5E1]">
                  {contactSearch.trim()
                    ? 'Searching your institution…'
                    : 'Searching usernames…'}
                </p>
              ) : contactSearchError ? (
                <p
                  role="alert"
                  className="px-3 py-4 text-center text-xs text-rose-700 dark:text-rose-300"
                >
                  {contactSearchError}
                </p>
              ) : contacts.length ? (
                contacts.map(contact => {
                  const selected = recipient === contact.id;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setRecipient(contact.id);
                        setContactSearch('');
                        setShowContactDropdown(false);
                        setError('');
                      }}
                      className={`flex w-full items-center justify-between gap-3 border-b border-[#E5E7EB] px-3 py-2.5 text-left last:border-b-0 dark:border-[#334155] ${
                        selected
                          ? 'bg-violet-100 text-violet-950 dark:bg-[#31234B] dark:text-white'
                          : 'bg-violet-50 text-[#091F5B] hover:bg-[#F3F0FF] dark:bg-[#172033] dark:text-[#F1F5F9] dark:hover:bg-[#26314A]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="inline-block max-w-full truncate rounded-md bg-violet-100 px-2 py-0.5 text-sm font-semibold text-violet-950 dark:bg-[#31234B] dark:text-[#F3E8FF]">
                          {contact.isDeleted
                            ? 'Deleted user'
                            : `@${contact.academicHandle}`}
                        </span>

                        <span className="block text-[11px] capitalize text-[#4B5563] dark:text-[#DBEAFE]">
                          {contact.isDeleted
                            ? 'Previous conversation · read only'
                            : contact.role}
                        </span>
                      </span>

                      {!contact.isDeleted && (
                        <span
                          className={`shrink-0 text-[10px] font-semibold ${
                            onlineContactIds.has(contact.id)
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-[#71809A] dark:text-[#94A3B8]'
                          }`}
                        >
                          {onlineContactIds.has(contact.id)
                            ? 'Online'
                            : 'Start chat'}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-center text-xs text-[#4B5563] dark:text-[#CBD5E1]">
                  {contactSearch.trim()
                    ? `No student or lecturer at your institution found for “${
                        contactSearch.trim().startsWith('@')
                          ? contactSearch.trim()
                          : `@${contactSearch.trim()}`
                      }”. Check the username and try again.`
                    : 'Type a username to find a student or lecturer at your institution.'}
                </p>
              )}
            </div>
          )}

          {selectedContact && (
            <p className="mt-2 text-xs text-[#4B5563] dark:text-[#CBD5E1]">
              Conversation with{' '}
              <strong className="inline-block rounded-md bg-violet-100 px-2 py-0.5 font-semibold text-violet-950 dark:bg-[#31234B] dark:text-[#D8CCFF]">
                @{selectedContact.academicHandle}
              </strong>{' '}
              · Messages are private to this conversation.
            </p>
          )}
        </div>
      )}

      {mode === 'direct' && recipient && (
        <div className="flex items-center gap-3 border-b border-violet-200 bg-violet-100 px-4 py-3 dark:border-[#334155] dark:bg-[#0F172A]">
          <button
            type="button"
            onClick={() => {
              setRecipient('');
              setMessages([]);
              setContactSearch('');
              setShowContactDropdown(false);
              setError('');
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-[#F3F0FF] dark:text-[#D8CCFF] dark:hover:bg-[#26314A]"
          >
            ← Recent conversations
          </button>
          <div className="min-w-0">
            <p className="inline-block max-w-full truncate rounded-md bg-violet-100 px-2 py-0.5 text-sm font-semibold text-violet-950 dark:bg-[#31234B] dark:text-[#D8CCFF]">
              {selectedContact?.isDeleted
                ? 'Deleted user'
                : selectedContact
                  ? `@${selectedContact.academicHandle}`
                  : 'Private conversation'}
            </p>
            <p className="text-[11px] text-[#71809A] dark:text-[#94A3B8]">
              Private conversation
            </p>
          </div>
          {!recipientDeleted && recipient && (
            <label className="ml-auto flex shrink-0 items-center gap-2 text-[11px] font-semibold text-violet-900 dark:text-[#E2E8F0]">
              <span className="hidden sm:inline">Disappearing messages</span>
              <select
                aria-label="Disappearing messages duration"
                value={retentionPeriod}
                disabled={savingRetention}
                onChange={event => void changeRetention(event.target.value as ChatRetentionPeriod)}
                className="max-w-[128px] rounded-lg border border-violet-300 bg-white px-2 py-2 text-xs font-semibold text-violet-900 outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 dark:border-[#475569] dark:bg-[#1E293B] dark:text-white"
              >
                <option value="90_days">90 days</option>
                <option value="7_days">7 days</option>
                <option value="24_hours">24 hours</option>
                <option value="off">Off</option>
              </select>
            </label>
          )}
          {!recipientDeleted && selectedContact && <ReportContentButton targetType="user" targetId={selectedContact.id} label="Report account" compact />}
        </div>
      )}

      {mode === 'direct' && recipient && !recipientDeleted && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs text-violet-950 dark:border-[#4C3A70] dark:bg-[#211A32] dark:text-[#E9DFFF]">
          <span aria-hidden="true">⏳</span>
          <p>
            {retentionPeriod === 'off'
              ? 'Automatic clearing is off for new messages. Messages sent under an earlier timer keep their original expiration. Changes apply to future messages only.'
              : `New messages in this private conversation automatically disappear after ${retentionPeriod === '90_days' ? '90 days' : retentionPeriod === '7_days' ? '7 days' : '24 hours'}. Either participant can change this setting. The timer applies to messages sent after the setting is selected.`}
          </p>
        </div>
      )}

      {recipientDeleted && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          This account was deleted. Previous messages are preserved, but this conversation is read-only.
        </div>
      )}

      {(mode === 'group' || recipient) && error && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </div>
      )}

      {(mode === 'group' || recipient) && (
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[#F3F6FC] p-4 dark:bg-[#0B1120]"
      >
        {hasMore && !loading && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={loadingOlder}
              className="rounded-lg border border-[#D7DEEA] bg-white px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-[#F3F0FF] disabled:opacity-50 dark:border-[#475569] dark:bg-[#172033] dark:text-[#D8CCFF] dark:hover:bg-[#26314A]"
            >
              {loadingOlder ? 'Loading older messages…' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-[#4B5563] dark:text-[#CBD5E1]">
            Loading messages…
          </p>
        ) : mode === 'direct' && !recipient ? (
          <p className="py-10 text-center text-sm text-[#4B5563] dark:text-[#CBD5E1]">
            Choose a contact to start a conversation.
          </p>
        ) : visibleMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#4B5563] dark:text-[#CBD5E1]">
            No messages yet. Start the conversation.
          </p>
        ) : (
          visibleMessages.map(message => (
            <article
              key={message.id}
              onPointerDown={event => {
                if (event.pointerType === 'mouse' || editing === message.id) return;
                longPressStartRef.current = { x: event.clientX, y: event.clientY };
                if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = window.setTimeout(() => {
                  if (message.isDeleted) {
                    setExpandedDeletedMessageId(message.id);
                  } else {
                    setSelectedMessage(message);
                  }
                  longPressTimerRef.current = null;
                }, 520);
              }}
              onPointerMove={event => {
                const start = longPressStartRef.current;
                if (!start) return;
                if (Math.abs(event.clientX - start.x) > 12 || Math.abs(event.clientY - start.y) > 12) {
                  if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                  longPressStartRef.current = null;
                }
              }}
              onPointerUp={() => {
                if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                longPressStartRef.current = null;
              }}
              onPointerCancel={() => {
                if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                longPressStartRef.current = null;
              }}
              onContextMenu={event => {
                if (editing === message.id) return;
                event.preventDefault();
                if (message.isDeleted) {
                  setExpandedDeletedMessageId(message.id);
                } else {
                  setSelectedMessage(message);
                }
              }}
              className={`w-fit max-w-[85%] min-w-0 rounded-2xl border p-3 shadow-sm ${
                message.isOwn
                  ? 'ml-auto border-violet-300 bg-violet-100 text-violet-950 dark:border-[#6D5AA8] dark:bg-[#31234B] dark:text-[#F3E8FF] lg:dark:border-violet-300 lg:dark:bg-violet-100 lg:dark:text-violet-950'
                  : 'mr-auto border-blue-200 bg-blue-50 text-blue-950 dark:border-[#334155] dark:bg-[#172033] dark:text-[#F1F5F9] lg:dark:border-blue-200 lg:dark:bg-blue-100 lg:dark:text-blue-950'
              }`}
            >
              <div
                className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${
                  message.isOwn
                    ? 'text-violet-800 dark:text-[#D8CCFF] lg:dark:text-violet-900'
                    : 'text-[#4B5563] dark:text-[#CBD5E1] lg:dark:text-violet-900'
                }`}
              >
                <strong
                  className={`font-bold ${
                    message.isOwn
                      ? 'text-violet-950 dark:text-[#F3E8FF] lg:dark:text-violet-950'
                      : 'text-[#091F5B] dark:text-[#F1F5F9] lg:dark:text-violet-950'
                  }`}
                >
                  {message.senderId
                    ? `@${message.senderHandle}`
                    : 'Deleted user'}
                </strong>

                <time
                  className={
                    message.isOwn
                      ? 'text-violet-800 dark:text-[#D8CCFF] lg:dark:text-violet-900'
                      : 'text-[#4B5563] dark:text-[#CBD5E1] lg:dark:text-violet-900'
                  }
                >
                  {new Date(message.createdAt).toLocaleString()}
                </time>
                {!message.isOwn && message.senderId && <ReportContentButton targetType="user" targetId={message.senderId} label="Report account" compact />}

                {message.editedAt && (
                  <span
                    className={
                      message.isOwn
                        ? 'text-violet-800 dark:text-[#D8CCFF] lg:dark:text-violet-900'
                        : 'text-[#4B5563] dark:text-[#CBD5E1]'
                    }
                  >
                    edited
                  </span>
                )}
              </div>

              {message.quotedMessage && (
                <div className="mb-2 rounded-lg border-l-4 border-violet-500 bg-white/70 px-2.5 py-2 text-xs dark:bg-[#0B1120]/70">
                  <p className="font-semibold text-violet-800 dark:text-violet-200">
                    {message.forwardedFromMessageId ? 'Forwarded from' : 'Replying to'} @{message.quotedMessage.senderHandle}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[#475569] dark:text-[#CBD5E1]">
                    {message.quotedMessage.isDeleted ? 'This message was deleted' : message.quotedMessage.contentType === 'voice' ? 'Voice message' : message.quotedMessage.contentType === 'sticker' ? 'Sticker' : message.quotedMessage.text}
                  </p>
                </div>
              )}
              {message.isDeleted ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setExpandedDeletedMessageId(current => current === message.id ? null : message.id)}
                    className="deleted-message-trigger block border-0 bg-transparent p-0 text-left text-sm italic text-[#4B5563] dark:text-[#CBD5E1]"
                    aria-expanded={expandedDeletedMessageId === message.id}
                    aria-label="Show options for deleted message"
                  >
                    This message was deleted.
                  </button>
                  {expandedDeletedMessageId === message.id && (
                    <button
                      type="button"
                      onClick={() => void hideDeletedMessage(message.id)}
                      className="rounded-lg border border-[#D7DEEA] bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-[#F3F0FF] dark:border-[#475569] dark:bg-[#172033] dark:text-[#D8CCFF] dark:hover:bg-[#26314A]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : message.contentType === 'voice' && message.voiceUrl ? (
                <VoiceMessagePlayer src={message.voiceUrl} />
              ) : message.contentType === 'sticker' ? (
                <div className="flex min-w-24 flex-col items-center rounded-xl bg-white px-4 py-3 dark:bg-[#26314A]">
                  <span className="text-5xl">
                    {STICKERS.find(sticker => sticker.id === message.stickerId)?.emoji ?? '✨'}
                  </span>

                  <span className="mt-1 text-xs font-semibold text-[#1F2937] dark:text-[#F1F5F9]">
                    {STICKERS.find(sticker => sticker.id === message.stickerId)?.label ?? 'Sticker'}
                  </span>
                </div>
              ) : editing === message.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={event => setEditText(event.target.value)}
                    className="chat-edit-input w-full rounded-lg border border-[#D7DEEA] bg-white p-2 text-sm text-[#091F5B] outline-none focus:border-[#2C36D9] dark:border-[#475569] dark:bg-[#0B1120] dark:text-white"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => void saveEdit(message.id)}
                      className="text-xs font-semibold text-violet-800 hover:underline dark:text-[#D8CCFF]"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs font-medium text-[#4B5563] hover:underline dark:text-[#CBD5E1]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className={`whitespace-pre-wrap break-words text-sm ${
                    message.isOwn
                      ? 'text-violet-950 dark:text-[#F3E8FF]'
                      : 'text-[#091F5B] dark:text-[#F1F5F9]'
                  }`}
                >
                  {message.text}
                </p>
              )}

              {!message.isOwn && !message.isDeleted && message.senderId && <div className="mt-2"><ReportContentButton targetType="chat_message" targetId={message.id} label="Report message" compact /></div>}

              {message.isOwn && !message.isDeleted && (
                <div className="mt-2 flex gap-3 text-xs">
                  <button
                    onClick={() => {
                      setEditing(message.id);
                      setEditText(message.text ?? '');
                    }}
                    disabled={
                      message.contentType !== 'text' ||
                      Date.now() - new Date(message.createdAt).getTime() >
                        15 * 60 * 1000
                    }
                    className="font-semibold text-violet-800 hover:underline disabled:opacity-40 dark:text-[#D8CCFF]"
                  >
                    Edit
                  </button>

                </div>
              )}
            </article>
          ))
        )}
      </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 p-3 sm:items-center" onClick={() => setSelectedMessage(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-2xl dark:border-[#475569] dark:bg-[#172033]" onClick={event => event.stopPropagation()}>
            <div className="mb-2 border-b border-[#E5E7EB] pb-2 dark:border-[#334155]">
              <p className="text-xs font-bold text-[#091F5B] dark:text-white">Message actions</p>
              <p className="mt-1 truncate text-xs text-[#64748B] dark:text-[#CBD5E1]">{selectedMessage.contentType === 'voice' ? 'Voice message' : selectedMessage.contentType === 'sticker' ? 'Sticker' : selectedMessage.text}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setReplyTarget(selectedMessage); setSelectedMessage(null); window.setTimeout(() => messageInputRef.current?.focus(), 0); }} className="rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:bg-[#31234B] dark:text-violet-100">Reply</button>
              {mode === 'group' && selectedMessage.senderId && selectedMessage.senderId !== user?.id && (
                <button type="button" onClick={() => { setReplyTarget(selectedMessage); setSelectedMessage(null); navigate(`/messages?userId=${encodeURIComponent(selectedMessage.senderId!)}`); }} className="rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:bg-[#31234B] dark:text-violet-100">Reply privately</button>
              )}
              <button type="button" onClick={() => setForwardDialogOpen(true)} className="rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:bg-[#31234B] dark:text-violet-100">Forward</button>
              {selectedMessage.contentType === 'text' && selectedMessage.text && (
                <button type="button" onClick={() => { void navigator.clipboard.writeText(selectedMessage.text ?? '').then(() => setError('Message copied.')).catch(() => setError('Could not copy this message.')); setSelectedMessage(null); }} className="rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:bg-[#31234B] dark:text-violet-100">Copy</button>
              )}
              {selectedMessage.isOwn && !selectedMessage.isDeleted && (
                <button type="button" onClick={() => { const id = selectedMessage.id; setSelectedMessage(null); void remove(id); }} className="rounded-xl bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300">Delete</button>
              )}
            </div>
            <button type="button" onClick={() => setSelectedMessage(null)} className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F3F6FC] dark:text-[#CBD5E1] dark:hover:bg-[#26314A]">Close</button>
          </div>
        </div>
      )}

      {forwardDialogOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3" onClick={() => { setForwardDialogOpen(false); setSelectedMessage(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl dark:bg-[#172033]" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#091F5B] dark:text-white">Forward message</h3>
              <button type="button" onClick={() => { setForwardDialogOpen(false); setSelectedMessage(null); }} className="rounded-lg px-2 py-1 text-sm text-[#64748B] hover:bg-[#F3F6FC] dark:text-[#CBD5E1]">Close</button>
            </div>
            <input value={forwardSearch} onChange={event => setForwardSearch(event.target.value)} placeholder="Find someone at your institution" className="mb-3 w-full rounded-xl border border-[#D7DEEA] bg-[#F8FAFD] px-3 py-2.5 text-sm text-[#091F5B] outline-none focus:border-violet-500 dark:border-[#475569] dark:bg-[#0B1120] dark:text-white" />
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {contacts.filter(contact => !contact.isDeleted && contact.id !== user?.id && contact.academicHandle.toLowerCase().includes(forwardSearch.trim().replace(/^@+/, '').toLowerCase())).map(contact => (
                <button key={contact.id} type="button" disabled={forwarding} onClick={async () => {
                  if (!selectedMessage) return;
                  setForwarding(true);
                  try {
                    await chatApi.forwardMessage(selectedMessage.id, contact.id);
                    setForwardDialogOpen(false);
                    setSelectedMessage(null);
                    setForwardSearch('');
                    setError('Message forwarded.');
                    void loadInbox();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Message could not be forwarded.');
                  } finally {
                    setForwarding(false);
                  }
                }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#1F2937] hover:bg-violet-50 disabled:opacity-50 dark:text-white dark:hover:bg-[#31234B]">
                  <span>@{contact.academicHandle}</span><span className="text-xs font-medium text-[#64748B] dark:text-[#CBD5E1]">{contact.role}</span>
                </button>
              ))}
              {!contacts.some(contact => !contact.isDeleted && contact.id !== user?.id && contact.academicHandle.toLowerCase().includes(forwardSearch.trim().replace(/^@+/, '').toLowerCase())) && <p className="py-5 text-center text-xs text-[#64748B] dark:text-[#CBD5E1]">No matching contacts.</p>}
            </div>
          </div>
        </div>
      )}

      {(mode === 'group' || recipient) && (
      <div className="border-t border-[#DCE4EF] bg-white p-3 dark:border-[#334155] dark:bg-[#0F172A]">
        {replyTarget && (
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-[#211A35]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-violet-800 dark:text-violet-200">Replying to @{replyTarget.senderHandle}</p>
              <p className="mt-1 truncate text-xs text-[#475569] dark:text-[#CBD5E1]">
                {replyTarget.isDeleted ? 'This message was deleted' : replyTarget.contentType === 'voice' ? 'Voice message' : replyTarget.contentType === 'sticker' ? 'Sticker' : replyTarget.text}
              </p>
            </div>
            <button type="button" onClick={() => setReplyTarget(null)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#475569] hover:bg-white dark:text-[#CBD5E1] dark:hover:bg-[#334155]">Cancel</button>
          </div>
        )}
        {(showEmoji || showStickers) && (
          <div className="mb-3 rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-sm dark:border-[#334155] dark:bg-[#172033]">
            <div className="mb-2 flex gap-2 border-b border-[#DCE4EF] pb-2 dark:border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setShowEmoji(true);
                  setShowStickers(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  showEmoji
                    ? 'bg-violet-100 text-violet-950 dark:bg-[#31234B] dark:text-[#D8CCFF]'
                    : 'text-[#4B5563] hover:bg-[#F8FAFD] dark:text-[#CBD5E1] dark:hover:bg-[#26314A]'
                }`}
              >
                Emoji
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowStickers(true);
                  setShowEmoji(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  showStickers
                    ? 'bg-violet-100 text-violet-950 dark:bg-[#31234B] dark:text-[#D8CCFF]'
                    : 'text-[#4B5563] hover:bg-[#F8FAFD] dark:text-[#CBD5E1] dark:hover:bg-[#26314A]'
                }`}
              >
                Stickers
              </button>
            </div>

            {showEmoji && (
              <div className="flex flex-wrap gap-2">
                {EMOJI.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText(value => value + emoji);
                      messageInputRef.current?.focus();
                    }}
                    className="rounded-lg p-2 text-xl hover:bg-[#F8FAFD] dark:hover:bg-[#26314A]"
                    aria-label={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {showStickers && (
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map(sticker => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => void sendSticker(sticker.id)}
                    disabled={
                      sending ||
                      (mode === 'direct' && (!recipient || recipientDeleted))
                    }
                    className="flex flex-col items-center rounded-xl border border-[#DCE4EF] bg-[#F3F6FC] px-2 py-3 hover:border-violet-300 hover:bg-[#F3F0FF] disabled:opacity-50 dark:border-[#475569] dark:bg-[#26314A] dark:hover:border-violet-500 dark:hover:bg-[#334155]"
                  >
                    <span className="text-3xl">{sticker.emoji}</span>

                    <span className="mt-1 text-[10px] font-medium text-[#1F2937] dark:text-[#F1F5F9]">
                      {sticker.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-[28px] border border-[#D7DEEA] bg-[#F8FAFD] px-3 py-1.5 focus-within:border-[#2C36D9] dark:border-[#475569] dark:bg-[#172033] dark:focus-within:border-[#8B7AE8]">
          {/* Text entry and voice recording/preview are mutually exclusive modes. */}
          {!recording && !previewBelongsToCurrentChat && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (showEmoji || showStickers) {
                    setShowEmoji(false);
                    setShowStickers(false);
                    messageInputRef.current?.focus();
                  } else {
                    setShowEmoji(true);
                    setShowStickers(false);
                  }
                }}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#4B5563] hover:bg-[#E8EDF5] dark:text-[#E2E8F0] dark:hover:bg-[#26314A]"
                aria-label={
                  showEmoji || showStickers
                    ? 'Close emoji and sticker panel and open keyboard'
                    : 'Open emoji and sticker panel'
                }
                title={
                  showEmoji || showStickers
                    ? 'Open keyboard'
                    : 'Emoji and stickers'
                }
              >
                {showEmoji || showStickers ? (
                  <Keyboard size={23} />
                ) : (
                  <Smile size={25} />
                )}
              </button>

              <textarea
                ref={messageInputRef}
                value={text}
                onFocus={() => {
                  setShowEmoji(false);
                  setShowStickers(false);
                }}
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  recipientDeleted
                    ? 'This conversation is read-only'
                    : 'Message'
                }
                disabled={recipientDeleted}
                rows={1}
                className="chat-message-input max-h-28 min-h-10 min-w-0 flex-1 resize-y border-0 bg-transparent px-0.5 py-2.5 text-[15px] text-[#091F5B] caret-[#091F5B] outline-none placeholder:text-[#71809A] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:caret-white dark:placeholder:text-[#94A3B8]"
              />

              {/* Use text first: the microphone is only available for an empty draft. */}
              {!text.trim() && (
                <button
                  type="button"
                  onPointerDown={event => {
                    if (recording || previewBelongsToCurrentChat || sending || (mode === 'direct' && (!recipient || recipientDeleted))) return;
                    event.preventDefault();
                    micHeldRef.current = true;
                    try {
                      event.currentTarget.setPointerCapture(event.pointerId);
                    } catch {
                      // Pointer capture is not required on every browser.
                    }
                    void startRecording();
                  }}
                  onPointerUp={() => {
                    micHeldRef.current = false;
                    finishRecording();
                  }}
                  onPointerCancel={() => {
                    micHeldRef.current = false;
                    finishRecording();
                  }}
                  onLostPointerCapture={() => {
                    if (micHeldRef.current) {
                      micHeldRef.current = false;
                      finishRecording();
                    }
                  }}
                  onContextMenu={event => event.preventDefault()}
                  disabled={
                    sending ||
                    (mode === 'direct' && (!recipient || recipientDeleted))
                  }
                  className="mb-0.5 flex h-10 w-10 shrink-0 touch-none items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  aria-label="Press and hold to record a voice message"
                  title="Press and hold to record a voice message"
                >
                  <Mic size={22} fill="currentColor" />
                </button>
              )}
            </>
          )}

          {recording && (
            <div className="mb-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-2 py-1.5 dark:bg-[#26314A]">
              <span className="shrink-0 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                Recording · release to preview
              </span>

              <div
                className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[2px]"
                role="img"
                aria-label="Live microphone frequency waveform"
              >
                {waveform.map((height, index) => (
                  <span
                    key={index}
                    className="w-[3px] rounded-full bg-emerald-600 transition-[height] duration-75 dark:bg-emerald-400"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {voicePreview && previewBelongsToCurrentChat && (
            <div className="mb-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-2 py-1.5 dark:bg-[#26314A]">
              <audio
                ref={previewAudioRef}
                preload="metadata"
                src={voicePreviewUrl}
                className="hidden"
                onEnded={() => setPreviewPlaying(false)}
                aria-label="Voice recording preview"
              />

              <button
                type="button"
                onClick={() => void toggleVoicePreview()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8FAFD] text-[#1F2937] hover:bg-[#E8EDF5] dark:bg-[#26314A] dark:text-white dark:hover:bg-[#334155]"
                aria-label={previewPlaying ? 'Pause voice preview' : 'Play voice preview'}
                title={previewPlaying ? 'Pause preview' : 'Play preview'}
              >
                {previewPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
              </button>

              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#1F2937] dark:text-[#F1F5F9]">
                Voice recording ready to send
              </span>

              <button
                type="button"
                onClick={discardVoicePreview}
                disabled={sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900"
                aria-label="Discard voice recording"
                title="Discard recording"
              >
                <Trash2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => void sendVoicePreview()}
                disabled={
                  sending ||
                  (mode === 'direct' && (!recipient || recipientDeleted))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-50"
                aria-label="Send voice recording"
                title="Send voice recording"
              >
                {sending ? <span className="text-[10px]">...</span> : <Send size={17} />}
              </button>
            </div>
          )}

          {!recording && !previewBelongsToCurrentChat && text.trim() && (
            <button
              type="button"
              onClick={() => void send()}
              disabled={
                sending ||
                (mode === 'direct' && !recipient)
              }
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-50"
              aria-label="Send message"
              title="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>

        <p className="mt-2 text-[10px] text-[#4B5563] dark:text-[#CBD5E1]">
          {recording
            ? 'Keep holding the microphone while recording; release it to preview.'
            : previewBelongsToCurrentChat
              ? 'Play, discard, or send your voice recording. Text entry returns after you discard or send.'
              : 'Enter to send · Shift + Enter for a new line · Press and hold the microphone to record'}
        </p>
      </div>
      )}
    </section>
  );
}
