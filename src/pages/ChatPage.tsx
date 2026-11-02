import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Mic, Send, Smile } from 'lucide-react';
import { chatApi, type ChatContact, type ChatMessage } from '../api/chat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'group' | 'direct';
const EMOJI = ['😀', '😂', '🥹', '😊', '😍', '👍', '👏', '🙏', '❤️', '🎉', '🔥', '💯'];
const STICKERS = [{id:'celebrate',emoji:'🎉',label:'Celebrate'},{id:'thank-you',emoji:'🙏',label:'Thank you'},{id:'well-done',emoji:'👏',label:'Well done'},{id:'studying',emoji:'📚',label:'Studying'},{id:'thinking',emoji:'🤔',label:'Thinking'},{id:'laughing',emoji:'😂',label:'Laughing'},{id:'encouragement',emoji:'💪',label:'You got this'},{id:'hello',emoji:'👋',label:'Hello'}];

function playSophisTone(kind: 'send' | 'receive') {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const notes = kind === 'send' ? [{ f: 659.25, t: 0, d: 0.075 }, { f: 987.77, t: 0.065, d: 0.11 }] : [{ f: 783.99, t: 0, d: 0.09 }, { f: 587.33, t: 0.085, d: 0.13 }];
    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.0001, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.11, now + note.t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(now + note.t); oscillator.stop(now + note.t + note.d + 0.015);
    }
    window.setTimeout(() => { void context.close(); }, 500);
  } catch { /* Sound is a convenience; it must never interrupt messaging. */ }
}

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(location.pathname === '/chat/group' && user?.role === 'student' ? 'group' : 'direct');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineContactIds, setOnlineContactIds] = useState<Set<string>>(() => new Set());
  const [recipient, setRecipient] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const filteredContacts = contacts.filter(contact => `${contact.academicHandle} ${contact.role}`.toLowerCase().includes(contactSearch.trim().replace(/^@/, '').toLowerCase()));
  const selectedContact = contacts.find(contact => contact.id === recipient);
  const recipientDeleted = Boolean(selectedContact?.isDeleted);
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
  const [blockedUsers, setBlockedUsers] = useState<Array<{ userId: string; academicHandle: string | null }>>([]);
  const [mutedGroup, setMutedGroup] = useState(() => { try { return window.localStorage.getItem('sophis-chat-muted-group') === 'true'; } catch { return false; } });
  const [mutedDirect, setMutedDirect] = useState(() => { try { return window.localStorage.getItem('sophis-chat-muted-direct') === 'true'; } catch { return false; } });
  const [recording, setRecording] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      // Presence is supplementary; chat remains usable if this request fails.
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try { setBlockedUsers(await chatApi.blocks()); } catch { /* Block controls remain unavailable if the server request fails. */ }
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
        const incoming = (result.items ?? []).filter(message => !message.isOwn && !message.isDeleted && knownMessageIdsRef.current?.has(message.id) === false);
        if (knownMessageIdsRef.current && incoming.length && !((mode === 'group' && mutedGroup) || (mode === 'direct' && mutedDirect))) playSophisTone('receive');
        setMessages(current => {
          const merged = new Map(current.map(message => [message.id, message]));
          for (const message of result.items ?? []) merged.set(message.id, message);
          return [...merged.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        if (!knownMessageIdsRef.current) knownMessageIdsRef.current = new Set();
        for (const message of result.items ?? []) knownMessageIdsRef.current.add(message.id);
      } else {
        setMessages(result.items ?? []);
        knownMessageIdsRef.current = new Set((result.items ?? []).map(message => message.id));
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

  useEffect(() => { void loadContacts(); void loadBlocks(); }, [loadContacts, loadBlocks]);
  useEffect(() => { try { window.localStorage.setItem('sophis-chat-muted-group', String(mutedGroup)); } catch { /* Preference is optional. */ } }, [mutedGroup]);
  useEffect(() => { try { window.localStorage.setItem('sophis-chat-muted-direct', String(mutedDirect)); } catch { /* Preference is optional. */ } }, [mutedDirect]);
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
    // Each navigation item opens a dedicated room; switching rooms happens through the sidebar.
    setMode(location.pathname === '/chat/group' && user?.role === 'student' ? 'group' : 'direct');
    setRecipient('');
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
    if (!value || sending || (mode === 'direct' && (!recipient || recipientDeleted))) return;
    setSending(true); setError('');
    try {
      const message = await chatApi.sendText(mode, value, mode === 'direct' ? recipient : undefined);
      shouldAutoScrollRef.current = true;
      setMessages(current => [...current, message]); setText(''); setShowEmoji(false); playSophisTone('send');
    } catch (e) { setError(e instanceof Error ? e.message : 'Message could not be sent.'); }
    finally { setSending(false); }
  };

  const sendSticker = async (stickerId: string) => {
    if (sending || (mode === 'direct' && (!recipient || recipientDeleted))) return;
    setSending(true); setError('');
    try {
      const message = await chatApi.sendSticker(mode, stickerId, mode === 'direct' ? recipient : undefined);
      shouldAutoScrollRef.current = true;
      setMessages(current => [...current, message]); setShowStickers(false); playSophisTone('send');
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
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access requires a secure browser connection. Open Sophis Central directly at https://sophiscentral.vercel.app and try again.');
      }
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
          setMessages(current => [...current, message]); playSophisTone('send');
        } catch (e) { setError(e instanceof Error ? e.message : 'Voice message could not be sent.'); }
        finally { setSending(false); }
      };
      recorderRef.current = recorder; recorder.start(); setRecording(true);
    } catch (e) {
      const errorName = e instanceof DOMException ? e.name : '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorName === 'SecurityError') {
        setError('Microphone permission was denied. Allow microphone access for sophiscentral.vercel.app in your browser or device site settings, then reload this page and try again.');
      } else {
        setError(e instanceof Error ? e.message : 'Microphone access was not available. Check your device microphone and browser permissions.');
      }
    }
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
      <div><h2 className="font-bold text-[#091F5B]">{mode === 'group' ? 'Group chat room' : 'Private DM'}</h2><p className="text-xs text-[#64748B]">{mode === 'group' ? 'Your institution, faculty and department community' : 'Private conversations with students and lecturers'}</p><button type="button" onClick={() => mode === 'group' ? setMutedGroup(value => !value) : setMutedDirect(value => !value)} className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">{(mode === 'group' ? mutedGroup : mutedDirect) ? 'Unmute notifications' : 'Mute notifications'}</button></div>
    </div>
    {mode === 'direct' && <div className="border-b border-[#E5E7EB] bg-white px-4 py-3">
      <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="chat-contact-search">Find a student or lecturer</label>
      <input id="chat-contact-search" type="search" value={contactSearch} onChange={event => setContactSearch(event.target.value)} placeholder="Search username (e.g. @username)" className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#25B866] focus:ring-2 focus:ring-[#25B866]/10" />
      <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white" role="listbox" aria-label="Available private conversations">
        {filteredContacts.length ? filteredContacts.map(contact => <button key={contact.id} type="button" role="option" aria-selected={recipient === contact.id} onClick={() => { setRecipient(contact.id); setError(''); }} className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-emerald-50 ${recipient === contact.id ? 'bg-emerald-50' : ''}`}>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{contact.isDeleted ? 'Deleted user' : `@${contact.academicHandle}`}</span><span className="block text-[11px] capitalize text-slate-500">{contact.isDeleted ? 'Previous conversation · read only' : contact.role}</span></span>
          {!contact.isDeleted && <span className={`shrink-0 text-[10px] font-semibold ${onlineContactIds.has(contact.id) ? 'text-emerald-600' : 'text-slate-400'}`}>{onlineContactIds.has(contact.id) ? 'Online' : 'Start chat'}</span>}
        </button>) : <p className="px-3 py-4 text-center text-xs text-slate-500">{contacts.length ? 'No usernames match your search.' : 'No eligible contacts yet. Users need an academic username and an active student or lecturer account to use Private DM.'}</p>}
      </div>
      {selectedContact && <p className="mt-2 text-xs text-slate-500">Conversation with <strong className="text-slate-700">@{selectedContact.academicHandle}</strong> · Messages are private to this conversation.</p>}
    </div>}
    {recipientDeleted && <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">This account was deleted. Previous messages are preserved, but this conversation is read-only.</div>}
    {error && <div role="alert" className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
      {hasMore && !loading && <div className="text-center"><button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{loadingOlder ? 'Loading older messages…' : 'Load older messages'}</button></div>}
      {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading messages…</p>
        : mode === 'direct' && !recipient ? <p className="py-10 text-center text-sm text-slate-500">Choose a contact to start a conversation.</p>
        : messages.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>
        : messages.map(message => <article key={message.id} className={`max-w-[85%] rounded-2xl border p-3 shadow-sm ${message.isOwn ? 'ml-auto border-[#DCD6FF] bg-[#F3F0FF]' : 'mr-auto border-slate-200 bg-white'}`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500"><strong className="text-slate-700">{message.senderId ? `@${message.senderHandle}` : 'Deleted user'}</strong><time>{new Date(message.createdAt).toLocaleString()}</time>{message.editedAt && <span>edited</span>}</div>
          {message.isDeleted ? <p className="text-sm italic text-slate-500">This message was deleted.</p>
            : message.contentType === 'voice' && message.voiceUrl ? <audio controls preload="none" src={message.voiceUrl} className="max-w-full" />
            : message.contentType === 'sticker' ? <div className="flex min-w-24 flex-col items-center rounded-xl bg-white/80 px-4 py-3"><span className="text-5xl">{STICKERS.find(sticker => sticker.id === message.stickerId)?.emoji ?? '✨'}</span><span className="mt-1 text-xs font-semibold text-slate-600">{STICKERS.find(sticker => sticker.id === message.stickerId)?.label ?? 'Sticker'}</span></div>
            : editing === message.id ? <div className="space-y-2"><textarea value={editText} onChange={event => setEditText(event.target.value)} className="w-full rounded-lg border p-2 text-sm" /><div className="flex gap-2"><button onClick={() => void saveEdit(message.id)} className="text-xs font-semibold text-violet-700">Save</button><button onClick={() => setEditing(null)} className="text-xs text-slate-500">Cancel</button></div></div>
            : <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{message.text}</p>}
          {message.isOwn && !message.isDeleted && <div className="mt-2 flex gap-3 text-xs"><button onClick={() => { setEditing(message.id); setEditText(message.text ?? ''); }} disabled={message.contentType !== 'text' || Date.now() - new Date(message.createdAt).getTime() > 15 * 60 * 1000} className="font-semibold text-violet-700 disabled:opacity-40">Edit</button><button onClick={() => void remove(message.id)} className="font-semibold text-rose-600">Delete</button></div>}
        </article>)}
    </div>
    <div className="border-t border-[#E5E7EB] bg-white p-3">
      {(showEmoji || showStickers) && <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex gap-2 border-b border-slate-100 pb-2">
          <button type="button" onClick={() => { setShowEmoji(true); setShowStickers(false); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${showEmoji ? 'bg-[#E8F8EE] text-[#087443]' : 'text-slate-500'}`}>Emoji</button>
          <button type="button" onClick={() => { setShowStickers(true); setShowEmoji(false); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${showStickers ? 'bg-[#E8F8EE] text-[#087443]' : 'text-slate-500'}`}>Stickers</button>
        </div>
        {showEmoji && <div className="flex flex-wrap gap-2">{EMOJI.map(emoji => <button key={emoji} type="button" onClick={() => { setText(value => value + emoji); messageInputRef.current?.focus(); }} className="rounded-lg p-2 text-xl hover:bg-slate-100" aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}
        {showStickers && <div className="grid grid-cols-4 gap-2">{STICKERS.map(sticker => <button key={sticker.id} type="button" onClick={() => void sendSticker(sticker.id)} disabled={sending || (mode === 'direct' && (!recipient || recipientDeleted))} className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50"><span className="text-3xl">{sticker.emoji}</span><span className="mt-1 text-[10px] font-medium text-slate-600">{sticker.label}</span></button>)}</div>}
      </div>}
      <div className="flex items-end gap-1.5 rounded-[28px] border border-slate-200 bg-[#F7F8FA] px-3 py-1.5 focus-within:border-[#25B866]">
        <button type="button" onClick={() => { if (showEmoji || showStickers) { setShowEmoji(false); setShowStickers(false); messageInputRef.current?.focus(); } else { setShowEmoji(true); setShowStickers(false); } }} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200" aria-label={showEmoji || showStickers ? 'Close emoji and sticker panel and open keyboard' : 'Open emoji and sticker panel'} title={showEmoji || showStickers ? 'Open keyboard' : 'Emoji and stickers'}>
          {showEmoji || showStickers ? <Keyboard size={23}/> : <Smile size={25}/>}
        </button>
        <textarea ref={messageInputRef} value={text} onFocus={() => { setShowEmoji(false); setShowStickers(false); }} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={recipientDeleted ? 'This conversation is read-only' : 'Message'} disabled={recipientDeleted} rows={1} className="max-h-28 min-h-10 min-w-0 flex-1 resize-y border-0 bg-transparent px-0.5 py-2.5 text-[15px] outline-none focus:ring-0" />
        <button type="button" onClick={() => recording ? stopRecording() : void startRecording()} disabled={sending || (mode === 'direct' && !recipient)} className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${recording ? 'bg-rose-600 text-white' : 'bg-[#20C76A] text-white hover:bg-[#17B85D]'} disabled:opacity-50`} aria-label={recording ? 'Stop recording' : 'Record voice message'} title={recording ? 'Stop recording' : 'Record voice message'}>{recording ? <span className="text-xs font-bold">Stop</span> : <Mic size={22} fill="currentColor"/>}</button>
        {text.trim() && <button type="button" onClick={() => void send()} disabled={sending || (mode === 'direct' && !recipient)} className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6121D0] text-white disabled:opacity-50" aria-label="Send message" title="Send message"><Send size={18}/></button>}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line · Voice recordings up to 12 MB</p>
    </div>
  </section>;
}
