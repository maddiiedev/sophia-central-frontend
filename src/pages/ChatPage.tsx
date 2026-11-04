
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Mic, Pause, Play, Send, Smile, Trash2 } from 'lucide-react';
import { chatApi, type ChatContact, type ChatMessage } from '../api/chat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();

  const mode: Mode =
    location.pathname === '/chat/group' && user?.role === 'student'
      ? 'group'
      : 'direct';

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineContactIds, setOnlineContactIds] = useState<Set<string>>(() => new Set());

  const [recipient, setRecipient] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactSearchLoading, setContactSearchLoading] = useState(true);
  const [contactSearchError, setContactSearchError] = useState('');

  const contactSearchSequenceRef = useRef(0);

  const selectedContact = contacts.find(contact => contact.id === recipient);
  const recipientDeleted = Boolean(selectedContact?.isDeleted);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
              : { items: [], hasMore: false, nextBefore: null };

        if (requestSequence !== requestSequenceRef.current) return;

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
    [mode, recipient, mutedGroup, mutedDirect],
  );

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
  }, [loadBlocks]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void loadContacts(contactSearch);
      },
      contactSearch.trim() ? 250 : 0,
    );

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
    });
  }, [loadMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadMessages(true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadMessages]);

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
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);
      setText('');
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
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);
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
      setPreviewPlaying(false);

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

        setVoicePreview(blob);
        setVoicePreviewUrl(previewUrl);
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
      );

      shouldAutoScrollRef.current = true;

      setMessages(current => [...current, message]);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }

      setVoicePreview(null);
      setVoicePreviewUrl('');
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
    <section className="mx-auto flex h-[calc(100vh-150px)] min-h-[520px] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      {/* Chat header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">
            {mode === 'group' ? 'Group chat room' : 'Private DM'}
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            {mode === 'group'
              ? 'Your institution, faculty and department community'
              : 'Private conversations with students and lecturers'}
          </p>

          <button
            type="button"
            onClick={() =>
              mode === 'group'
                ? setMutedGroup(value => !value)
                : setMutedDirect(value => !value)
            }
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {(mode === 'group' ? mutedGroup : mutedDirect)
              ? 'Unmute notifications'
              : 'Mute notifications'}
          </button>
        </div>
      </div>

      {/* Private conversation search */}
      {mode === 'direct' && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <label
            className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
            htmlFor="chat-contact-search"
          >
            Find a student or lecturer
          </label>

          <input
            id="chat-contact-search"
            type="search"
            value={contactSearch}
            onFocus={() => setShowContactDropdown(true)}
            onChange={event => {
              setContactSearch(event.target.value);
              setShowContactDropdown(true);
            }}
            placeholder="Search username (e.g. @username)"
            className="mb-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-emerald-400"
          />

          {showContactDropdown && (
            <div
              className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
              role="listbox"
              aria-label="Available private conversations"
            >
              {contactSearchLoading ? (
                <p className="px-3 py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                  {contactSearch.trim()
                    ? 'Searching usernames…'
                    : 'Loading available accounts…'}
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
                      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 dark:border-slate-700 ${
                        selected
                          ? 'bg-emerald-50 text-slate-900 dark:bg-slate-700 dark:text-white'
                          : 'bg-white text-slate-900 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-purple-300">
                          {contact.isDeleted
                            ? 'Deleted user'
                            : `@${contact.academicHandle}`}
                        </span>

                        <span className="block text-[11px] capitalize text-slate-600 dark:text-purple-300">
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
                              : 'text-slate-500 dark:text-slate-400'
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
                <p className="px-3 py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                  {contactSearch.trim()
                    ? `No student or lecturer account found for “${
                        contactSearch.trim().startsWith('@')
                          ? contactSearch.trim()
                          : `@${contactSearch.trim()}`
                      }”. Check the username and try again.`
                    : 'No searchable student or lecturer accounts are available right now.'}
                </p>
              )}
            </div>
          )}

          {selectedContact && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Conversation with{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                @{selectedContact.academicHandle}
              </strong>{' '}
              · Messages are private to this conversation.
            </p>
          )}
        </div>
      )}

      {recipientDeleted && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          This account was deleted. Previous messages are preserved, but this conversation is read-only.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </div>
      )}

      {/* Message history */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950"
      >
        {hasMore && !loading && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={loadingOlder}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-violet-200 dark:hover:bg-slate-700"
            >
              {loadingOlder ? 'Loading older messages…' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-300">
            Loading messages…
          </p>
        ) : mode === 'direct' && !recipient ? (
          <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-300">
            Choose a contact to start a conversation.
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-300">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map(message => (
            <article
              key={message.id}
              className={`max-w-[85%] rounded-2xl border p-3 shadow-sm ${
                message.isOwn
                  ? 'ml-auto border-violet-300 bg-violet-100 text-violet-950 dark:border-violet-800 dark:bg-[#31234B] dark:text-white'
                  : 'mr-auto border-slate-200 bg-white text-slate-900 dark:border-white dark:bg-slate-800 dark:text-purple-300'
              }`}
            >
              <div
                className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${
                  message.isOwn
                    ? 'text-violet-800 dark:text-violet-200'
                    : 'text-slate-600 dark:text-purple-300'
                }`}
              >
                <strong
                  className={`font-bold ${
                    message.isOwn
                      ? 'text-violet-950 dark:text-white'
                      : 'text-slate-900 dark:text-purple-300'
                  }`}
                >
                  {message.senderId
                    ? `@${message.senderHandle}`
                    : 'Deleted user'}
                </strong>

                <time
                  className={
                    message.isOwn
                      ? 'text-violet-800 dark:text-violet-200'
                      : 'text-slate-600 dark:text-purple-300'
                  }
                >
                  {new Date(message.createdAt).toLocaleString()}
                </time>

                {message.editedAt && (
                  <span
                    className={
                      message.isOwn
                        ? 'text-violet-800 dark:text-violet-200'
                        : 'text-slate-600 dark:text-purple-300'
                    }
                  >
                    edited
                  </span>
                )}
              </div>

              {message.isDeleted ? (
                <p className="text-sm italic text-slate-600 dark:text-purple-300">
                  This message was deleted.
                </p>
              ) : message.contentType === 'voice' && message.voiceUrl ? (
                <audio
                  controls
                  preload="none"
                  src={message.voiceUrl}
                  className="max-w-full"
                />
              ) : message.contentType === 'sticker' ? (
                <div className="flex min-w-24 flex-col items-center rounded-xl bg-white px-4 py-3 dark:bg-slate-700">
                  <span className="text-5xl">
                    {STICKERS.find(sticker => sticker.id === message.stickerId)?.emoji ?? '✨'}
                  </span>

                  <span className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {STICKERS.find(sticker => sticker.id === message.stickerId)?.label ?? 'Sticker'}
                  </span>
                </div>
              ) : editing === message.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={event => setEditText(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => void saveEdit(message.id)}
                      className="text-xs font-semibold text-violet-800 hover:underline dark:text-violet-200"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs font-medium text-slate-600 hover:underline dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className={`whitespace-pre-wrap break-words text-sm ${
                    message.isOwn
                      ? 'text-violet-950 dark:text-white'
                      : 'text-slate-900 dark:text-purple-300'
                  }`}
                >
                  {message.text}
                </p>
              )}

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
                    className="font-semibold text-violet-800 hover:underline disabled:opacity-40 dark:text-violet-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => void remove(message.id)}
                    className="font-semibold text-rose-700 hover:underline dark:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        {(showEmoji || showStickers) && (
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShowEmoji(true);
                  setShowStickers(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  showEmoji
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
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
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
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
                    className="rounded-lg p-2 text-xl hover:bg-slate-100 dark:hover:bg-slate-700"
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
                    className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-violet-500 dark:hover:bg-slate-600"
                  >
                    <span className="text-3xl">{sticker.emoji}</span>

                    <span className="mt-1 text-[10px] font-medium text-slate-700 dark:text-slate-100">
                      {sticker.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-[28px] border border-slate-300 bg-slate-100 px-3 py-1.5 focus-within:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:focus-within:border-emerald-400">
          {/* Text entry and voice recording/preview are mutually exclusive modes. */}
          {!recording && !voicePreview && (
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
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
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
                className="max-h-28 min-h-10 min-w-0 flex-1 resize-y border-0 bg-transparent px-0.5 py-2.5 text-[15px] text-slate-900 caret-slate-900 outline-none placeholder:text-slate-500 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:caret-white dark:placeholder:text-slate-300"
              />

              {/* Use text first: the microphone is only available for an empty draft. */}
              {!text.trim() && (
                <button
                  type="button"
                  onPointerDown={event => {
                    if (recording || voicePreview || sending || (mode === 'direct' && (!recipient || recipientDeleted))) return;
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
            <div className="mb-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-2 py-1.5 dark:bg-slate-700">
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

          {voicePreview && (
            <div className="mb-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-2 py-1.5 dark:bg-slate-700">
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                aria-label={previewPlaying ? 'Pause voice preview' : 'Play voice preview'}
                title={previewPlaying ? 'Pause preview' : 'Play preview'}
              >
                {previewPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
              </button>

              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-100">
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

          {!recording && !voicePreview && text.trim() && (
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

        <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-300">
          {recording
            ? 'Keep holding the microphone while recording; release it to preview.'
            : voicePreview
              ? 'Play, discard, or send your voice recording. Text entry returns after you discard or send.'
              : 'Enter to send · Shift + Enter for a new line · Press and hold the microphone to record'}
        </p>
      </div>
    </section>
  );
}
