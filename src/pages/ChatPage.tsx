import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, type ChatContact, type ChatMessage } from '../api/chat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'group' | 'direct';
const EMOJI = ['😀', '😂', '🥹', '😊', '😍', '👍', '👏', '🙏', '❤️', '🎉', '🔥', '💯'];
const STICKERS = [{id:'celebrate',emoji:'🎉',label:'Celebrate'},{id:'thank-you',emoji:'🙏',label:'Thank you'},{id:'well-done',emoji:'👏',label:'Well done'},{id:'studying',emoji:'📚',label:'Studying'},{id:'thinking',emoji:'🤔',label:'Thinking'},{id:'laughing',emoji:'😂',label:'Laughing'},{id:'encouragement',emoji:'💪',label:'You got this'},{id:'hello',emoji:'👋',label:'Hello'}];

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(location.pathname === '/chat/group' && user?.role === 'student' ? 'group' : 'direct');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineContactIds, setOnlineContactIds] = useState<Set<string>>(() => new Set());
  const [recipient, setRecipient] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const requestSequenceRef = useRef(0);
  const activeConversationRef = useRef(`${mode}:${recipient}`);
  activeConversationRef.current = `${mode}:${recipient}`;

  const loadPresence = useCallback(async () => {
    try {
      const result = await chatApi.presence();
      setOnlineContactIds(new Set(result.filter(item => item.online).map(item => item.id)));
    } catch {
      // Presence is supplementary; chat remains usable if this request fails.
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const result = await chatApi.contacts();
      setContacts(Array.isArray(result) ? result : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load contacts.'); }
  }, []);

  const loadMessages = useCallback(async (quiet = false) => {
    const requestSequence = quiet ? requestSequenceRef.current : ++requestSequenceRef.current;
    if (!quiet) setLoading(true);
    try {
      const result = mode === 'group'
        ? await chatApi.groupHistory()
        : recipient ? await chatApi.directHistory(recipient) : { items: [], hasMore: false, nextBefore: null };
      if (requestSequence !== requestSequenceRef.current) return;
      if (quiet) {
        const container = listRef.current;
        shouldAutoScrollRef.current = !!container && container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setMessages(current => {
          const merged = new Map(current.map(message => [message.id, message]));
          for (const message of result.items ?? []) merged.set(message.id, message);
          return [...merged.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      } else {
        setMessages(result.items ?? []);
        setHasMore(result.hasMore ?? false);
        setNextBefore(result.nextBefore ?? null);
      }
      setError('');
    } catch (e) {
      if (requestSequence === requestSequenceRef.current) setError(e instanceof Error ? e.message : 'Could not load messages.');
    } finally {
      if (requestSequence === requestSequenceRef.current) setLoading(false);
    }
  }, [mode, recipient]);

  const loadOlder = async () => {
    if (!hasMore || !nextBefore || loadingOlder || !listRef.current) return;
    const container = listRef.current;
    const requestSequence = requestSequenceRef.current;
    const conversationKey = `${mode}:${recipient}`;
    preserveScrollRef.current = { height: container.scrollHeight, top: container.scrollTop };
    setLoadingOlder(true);
    try {
      const result = mode === 'group'
        ? await chatApi.groupHistory(40, nextBefore)
        : await chatApi.directHistory(recipient, 40, nextBefore);
      if (requestSequence !== requestSequenceRef.current || conversationKey !== activeConversationRef.current) {
        preserveScrollRef.current = null;
        return;
      }
      setMessages(current => {
        const known = new Set(current.map(message => message.id));
        return [...(result.items ?? []).filter(message => !known.has(message.id)), ...current];
      });
      setHasMore(result.hasMore ?? false);
      setNextBefore(result.nextBefore ?? null);
    } catch (e) {
      if (requestSequence === requestSequenceRef.current && conversationKey === activeConversationRef.current) {
        preserveScrollRef.current = null;
        setError(e instanceof Error ? e.message : 'Could not load older messages.');
      }
    } finally {
      if (conversationKey === activeConversationRef.current) setLoadingOlder(false);
    }
  };

  useEffect(() => { void loadContacts(); }, [loadContacts]);
  useEffect(() => {
    let active = true;
    const sendHeartbeat = async () => {
      try { await chatApi.heartbeat(); } catch { /* A missed heartbeat simply expires. */ }
      if (active) void loadPresence();
    };
    void sendHeartbeat();
    const timer = window.setInterval(() => { void sendHeartbeat(); }, 25000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loadPresence]);
  useEffect(() => {
    if (location.pathname === '/chat/group' && user?.role === 'student') setMode('group');
    else if (location.pathname === '/messages') setMode('direct');
  }, [location.pathname, user?.role]);
  useEffect(() => {
    setMessages([]); setHasMore(false); setNextBefore(null); setLoadingOlder(false);
    preserveScrollRef.current = null;
    void loadMessages();
  }, [loadMessages]);
  useEffect(() => chatApi.subscribe(() => { void loadMessages(true); }), [loadMessages]);
  useEffect(() => {
    const timer = window.setInterval(() => { void loadMessages(true); }, 30000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    if (preserveScrollRef.current) {
      const previous = preserveScrollRef.current;
      container.scrollTop = previous.top + (container.scrollHeight - previous.height);
      preserveScrollRef.current = null;
    } else if (shouldAutoScrollRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending || (mode === 'direct' && !recipient)) return;
    setSending(true); setError('');
    try {
      const message = await chatApi.sendText(mode, value, mode === 'direct' ? recipient : undefined);
      shouldAutoScrollRef.current = true;
      setMessages(current => [...current, message]); setText(''); setShowEmoji(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Message could not be sent.'); }
    finally { setSending(false); }
  };

  const sendSticker = async (stickerId: string) => {
    if (sending || (mode === 'direct' && !recipient)) return;
    setSending(true); setError('');
    try {
      const message = await chatApi.sendSticker(mode, stickerId, mode === 'direct' ? recipient : undefined);
      shouldAutoScrollRef.current = true;
      setMessages(current => [...current, message]); setShowStickers(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Sticker could not be sent.'); }
    finally { setSending(false); }
  };

  const saveEdit = async (id: string) => {
    try {
      const updated = await chatApi.edit(id, editText);
      setMessages(current => current.map(message => message.id === id ? updated : message));
      setEditing(null); setEditText('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Message could not be edited.'); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try { await chatApi.remove(id); await loadMessages(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Message could not be deleted.'); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (!blob.size) return;
        if (blob.size > 12 * 1024 * 1024) { setError('Recording exceeds the 12 MB limit.'); return; }
        setSending(true);
        try {
          const mime = blob.type.split(';')[0] || 'audio/webm';
          const upload = await chatApi.voiceUpload(mime, blob.size);
          const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': upload.contentType }, body: blob });
          if (!response.ok) throw new Error('Voice upload failed. Please try again.');
          const message = await chatApi.sendVoice(mode, upload.key, mode === 'direct' ? recipient : undefined);
          shouldAutoScrollRef.current = true;
          setMessages(current => [...current, message]);
        } catch (e) { setError(e instanceof Error ? e.message : 'Voice message could not be sent.'); }
        finally { setSending(false); }
      };
      recorderRef.current = recorder; recorder.start(); setRecording(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Microphone access was not available.'); }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  if (user?.role !== 'student' && user?.role !== 'lecturer') {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Chat is available to students and lecturers only.</div>;
  }

  return <section className="mx-auto flex h-[calc(100vh-150px)] min-h-[520px] max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] p-4">
      <div><h2 className="font-bold text-[#091F5B]">Academic chat</h2><p className="text-xs text-[#64748B]">Connect with your academic community</p></div>
      <div className="flex gap-2">
        {user.role === 'student' && <button onClick={() => setMode('group')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'group' ? 'bg-[#6121D0] text-white' : 'bg-slate-100 text-slate-700'}`}>Group Chat</button>}
        <button onClick={() => setMode('direct')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'direct' ? 'bg-[#6121D0] text-white' : 'bg-slate-100 text-slate-700'}`}>Messages</button>
      </div>
    </div>
    {mode === 'direct' && <div className="border-b border-[#E5E7EB] px-4 py-3"><label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="chat-contact">Message a student or lecturer</label><select id="chat-contact" value={recipient} onChange={event => setRecipient(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"><option value="">Choose a contact</option>{contacts.map(contact => <option key={contact.id} value={contact.id}>@{contact.academicHandle} · {contact.role}{onlineContactIds.has(contact.id) ? ' · Online' : ''}</option>)}</select></div>}
    {error && <div role="alert" className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
      {hasMore && !loading && <div className="text-center"><button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{loadingOlder ? 'Loading older messages…' : 'Load older messages'}</button></div>}
      {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading messages…</p>
        : mode === 'direct' && !recipient ? <p className="py-10 text-center text-sm text-slate-500">Choose a contact to start a conversation.</p>
        : messages.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>
        : messages.map(message => <article key={message.id} className={`max-w-[85%] rounded-2xl border p-3 shadow-sm ${message.isOwn ? 'ml-auto border-[#DCD6FF] bg-[#F3F0FF]' : 'mr-auto border-slate-200 bg-white'}`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500"><strong className="text-slate-700">@{message.senderHandle}</strong><time>{new Date(message.createdAt).toLocaleString()}</time>{message.editedAt && <span>edited</span>}</div>
          {message.isDeleted ? <p className="text-sm italic text-slate-500">This message was deleted.</p>
            : message.contentType === 'voice' && message.voiceUrl ? <audio controls preload="none" src={message.voiceUrl} className="max-w-full" />
            : message.contentType === 'sticker' ? <div className="flex min-w-24 flex-col items-center rounded-xl bg-white/80 px-4 py-3"><span className="text-5xl">{STICKERS.find(sticker => sticker.id === message.stickerId)?.emoji ?? '✨'}</span><span className="mt-1 text-xs font-semibold text-slate-600">{STICKERS.find(sticker => sticker.id === message.stickerId)?.label ?? 'Sticker'}</span></div>
            : editing === message.id ? <div className="space-y-2"><textarea value={editText} onChange={event => setEditText(event.target.value)} className="w-full rounded-lg border p-2 text-sm" /><div className="flex gap-2"><button onClick={() => void saveEdit(message.id)} className="text-xs font-semibold text-violet-700">Save</button><button onClick={() => setEditing(null)} className="text-xs text-slate-500">Cancel</button></div></div>
            : <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{message.text}</p>}
          {message.isOwn && !message.isDeleted && <div className="mt-2 flex gap-3 text-xs"><button onClick={() => { setEditing(message.id); setEditText(message.text ?? ''); }} disabled={message.contentType !== 'text' || Date.now() - new Date(message.createdAt).getTime() > 15 * 60 * 1000} className="font-semibold text-violet-700 disabled:opacity-40">Edit</button><button onClick={() => void remove(message.id)} className="font-semibold text-rose-600">Delete</button></div>}
        </article>)}
    </div>
    <div className="border-t border-[#E5E7EB] bg-white p-3">
      {showEmoji && <div className="mb-2 flex flex-wrap gap-2">{EMOJI.map(emoji => <button key={emoji} onClick={() => setText(value => value + emoji)} className="rounded-lg p-2 text-xl hover:bg-slate-100" aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}
      {showStickers && <div className="mb-3 grid grid-cols-4 gap-2">{STICKERS.map(sticker => <button key={sticker.id} type="button" onClick={() => void sendSticker(sticker.id)} disabled={sending || (mode === 'direct' && !recipient)} className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50"><span className="text-3xl">{sticker.emoji}</span><span className="mt-1 text-[10px] font-medium text-slate-600">{sticker.label}</span></button>)}</div>}
      <div className="flex items-end gap-2">
        <div className="flex gap-1"><button onClick={() => { setShowEmoji(value => !value); setShowStickers(false); }} className="rounded-xl border border-slate-200 px-3 py-3 text-lg" aria-label="Choose emoji">😊</button><button onClick={() => { setShowStickers(value => !value); setShowEmoji(false); }} className="rounded-xl border border-slate-200 px-3 py-3 text-lg" aria-label="Choose sticker">✨</button></div>
        <textarea value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a message…" rows={1} className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-400" />
        <button onClick={() => recording ? stopRecording() : void startRecording()} disabled={sending || (mode === 'direct' && !recipient)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${recording ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-700'}`} aria-label={recording ? 'Stop recording' : 'Record voice message'}>{recording ? 'Stop' : '🎙️'}</button>
        <button onClick={() => void send()} disabled={sending || !text.trim() || (mode === 'direct' && !recipient)} className="rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? '…' : 'Send'}</button>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line · Voice recordings up to 12 MB</p>
    </div>
  </section>;
}
