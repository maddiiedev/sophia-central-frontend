import { useEffect, useState } from 'react';
import { MarkdownContent } from '../components/ai/MarkdownContent';
import { BrainCircuit, SendHorizontal, Download, RotateCcw } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import type { Resource } from '../types';

type TutorMessage = { id?: string; role: 'user' | 'assistant'; content: string };

const suggestedQuestions = [
  'Explain binary search with a worked example.',
  'What is the difference between RAM and ROM?',
  'Create five practice questions on digital logic.',
];

export function AITutorPage() {
  const [question, setQuestion] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [conversation, setConversation] = useState<TutorMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastPointsUsed, setLastPointsUsed] = useState<number | null>(null);
  const [balanceRemaining, setBalanceRemaining] = useState<number | null>(null);
  const { user } = useAuth();
  const activeSessionStorageKey = user?.id ? `sophis-ai-active-session:${user.id}` : null;
  const [downloadedResources, setDownloadedResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');

  useEffect(() => {
    let active = true;
    if (!user) return;
    void resourcesApi.downloaded().then((resources) => {
      if (active) setDownloadedResources(resources.filter((resource) => resource.moderationStatus === 'approved' || resource.isVerified === true));
    }).catch(() => { if (active) setDownloadedResources([]); });
    return () => { active = false; };
  }, [user?.id]);


  useEffect(() => {
    if (!activeSessionStorageKey) return;
    let active = true;
    let savedSessionId: string | null = null;
    try {
      savedSessionId = window.localStorage.getItem(activeSessionStorageKey);
    } catch {
      // Private browsing/storage restrictions should not prevent AI chat from working.
    }
    if (!savedSessionId) return;

    void sophiaApi.ai.getSession(savedSessionId)
      .then((savedSession) => {
        if (!active) return;
        setSessionId(savedSession.sessionId);
        setConversation(savedSession.messages);
        if (savedSession.resourceId) setSelectedResourceId(savedSession.resourceId);
      })
      .catch(() => {
        if (!active) return;
        try {
          window.localStorage.removeItem(activeSessionStorageKey);
        } catch {
          // Ignore storage cleanup failures; the backend remains the source of truth.
        }
      });
    return () => { active = false; };
  }, [activeSessionStorageKey]);

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;
    setIsLoading(true);
    setError('');
    const pendingMessageId = crypto.randomUUID();
    setConversation((current) => [...current, { id: pendingMessageId, role: 'user', content: trimmedQuestion }]);
    setQuestion('');

    try {
      const response = await sophiaApi.ai.ask({
        question: trimmedQuestion,
        ...(sessionId ? { sessionId } : {}),
        ...(selectedResourceId ? { resourceId: selectedResourceId } : {}),
      });
      if (response.sessionId) {
        setSessionId(response.sessionId);
        if (activeSessionStorageKey) {
          try { window.localStorage.setItem(activeSessionStorageKey, response.sessionId); } catch { /* Server-side session remains saved. */ }
        }
      }
      setConversation((current) => [...current.map((message) => message.id === pendingMessageId ? { ...message, id: response.userMessageId ?? pendingMessageId } : message), { role: 'assistant', content: response.answer }]);
      setLastPointsUsed(response.pointsUsed ?? null);
      setBalanceRemaining(response.balanceRemaining ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Sophis AI could not answer this question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const saveEditedQuestion = async (messageId: string) => {
    const nextQuestion = editDraft.trim();
    if (!nextQuestion || !sessionId || isLoading) return;
    const targetIndex = conversation.findIndex((message) => message.id === messageId);
    if (targetIndex < 0) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await sophiaApi.ai.editMessage({
        sessionId,
        messageId,
        question: nextQuestion,
      });
      setConversation((current) => {
        const index = current.findIndex((message) => message.id === messageId);
        if (index < 0) return current;
        return [
          ...current.slice(0, index),
          { ...current[index], id: response.userMessageId ?? messageId, content: nextQuestion },
          { role: 'assistant', content: response.answer },
        ];
      });
      if (response.sessionId) setSessionId(response.sessionId);
      setLastPointsUsed(response.pointsUsed ?? null);
      setBalanceRemaining(response.balanceRemaining ?? null);
      setEditingMessageId(null);
      setEditDraft('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sophis could not regenerate this answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    if (isLoading) return;
    setConversation([]);
    setEditingMessageId(null);
    setEditDraft('');
    setSessionId(undefined);
    if (activeSessionStorageKey) {
      try { window.localStorage.removeItem(activeSessionStorageKey); } catch { /* Starting a new chat must still work. */ }
    }
    setError('');
    setLastPointsUsed(null);
    setBalanceRemaining(null);
    setQuestion('');
  };

  return <div className="space-y-6">
    <SectionTitle eyebrow="AI tutor" title="Ask Sophis" />
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <OverviewCard title="Study support" action="Live AI tutor">
        <div className="space-y-4 text-sm text-[#374151]">
          <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[#6121D0]"><BrainCircuit size={16}/><span>Ask about any subject</span></div>
            <p className="mt-2 text-[#4B5563]">Sophis answers academic questions, explains concepts step by step, creates practice questions, and uses the context of your follow-up questions.</p>
            <ul className="mt-4 space-y-2 text-[#4B5563]">
              {suggestedQuestions.map((suggestion) => (
                <li key={suggestion}>
                  <button type="button" onClick={() => setQuestion(suggestion)} className="text-left text-[#6121D0] underline decoration-[#D8C7F5] underline-offset-4 hover:text-[#2C36D9]">{suggestion}</button>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-5 text-[#71809A]">Responses are generated by the configured AI provider. AI usage costs 2 Wisdom Points per question. If generation fails, points are not deducted.</p>
        </div>
      </OverviewCard>

      <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#091F5B]">Your conversation</h2>
            <p className="text-xs text-[#71809A]">Ask a question, then continue with follow-ups.</p>
          </div>
          <button type="button" onClick={startNewChat} disabled={isLoading || conversation.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#4B5563] hover:bg-[#F8FAFD] disabled:opacity-40"><RotateCcw size={14}/>New chat</button>
        </div>

        <div className="mb-4 max-h-[440px] min-h-24 space-y-3 overflow-y-auto rounded-xl bg-[#F8FAFD] p-3" aria-live="polite">
          {conversation.length === 0 && <p className="py-6 text-center text-sm text-[#71809A]">Your answers will appear here. Start by asking Sophis a question.</p>}
          {conversation.map((message, index) => (
            <div key={message.id ?? index} className={message.role === 'user' ? 'ml-6 min-w-0 rounded-xl bg-[#6121D0] p-3 text-sm leading-6 text-white' : 'mr-6 min-w-0 rounded-xl border border-[#DCE4EF] bg-white p-3 text-sm leading-7 text-[#1F2937]'}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className={message.role === 'user' ? 'text-xs font-semibold text-white/75' : 'text-xs font-semibold text-[#6121D0]'}>{message.role === 'user' ? 'You' : 'Sophis'}</p>
                {message.role === 'user' && message.id && sessionId && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setEditingMessageId(message.id ?? null); setEditDraft(message.content); setError(''); }}
                    className="text-xs font-semibold text-white/90 underline underline-offset-2 hover:text-white disabled:opacity-40"
                  >
                    Edit question
                  </button>
                )}
              </div>
              {editingMessageId === message.id ? (
                <div className="space-y-2">
                  <textarea
                    aria-label="Edit your Sophis AI question"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    maxLength={4000}
                    rows={Math.max(2, Math.min(6, editDraft.split('\\n').length))}
                    className="w-full rounded-lg border border-white/40 bg-white p-2 text-sm leading-6 text-[#091F5B] outline-none focus:ring-2 focus:ring-white/70"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => void saveEditedQuestion(message.id!)} disabled={!editDraft.trim() || isLoading} className="text-xs font-bold text-white underline underline-offset-2 disabled:opacity-40">Save and regenerate</button>
                    <button type="button" onClick={() => { setEditingMessageId(null); setEditDraft(''); }} className="text-xs font-medium text-white/80 underline underline-offset-2">Cancel</button>
                  </div>
                  <p className="text-[11px] leading-4 text-white/75">Regenerating an answer uses 2 Wisdom Points. Messages after this question will be replaced.</p>
                </div>
              ) : message.role === 'assistant' ? (
                <MarkdownContent content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
              )}
            </div>
          ))}
          {isLoading && <div className="mr-6 rounded-xl border border-[#DCE4EF] bg-white p-3 text-sm text-[#6121D0]">Sophis is thinking…</div>}
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {lastPointsUsed !== null && <p className="mb-3 text-xs text-[#71809A]">{lastPointsUsed} Wisdom Points used{balanceRemaining !== null ? ` · ${balanceRemaining} remaining` : ''}.</p>}

        <label className="block text-sm font-semibold text-[#091F5B]">
          <span className="mb-2 block">Your question</span>
          <textarea value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleAsk(); } }} placeholder="Ask Sophis anything about your studies…" maxLength={4000} className="min-h-28 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 font-normal text-[#091F5B] outline-none placeholder:text-[#71809A] focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/20"/>
        </label>

        <div className="mt-4 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3">
          <label htmlFor="ai-downloaded-resource" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#091F5B]"><Download size={16} className="text-[#6121D0]"/>Add approved downloaded material <span className="font-normal text-[#71809A]">(optional)</span></label>
          <select id="ai-downloaded-resource" value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} className="w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/20">
            <option value="">Ask without adding a material</option>
            {downloadedResources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
          </select>
          <p className="mt-2 text-xs text-[#5C6982]">The AI currently receives resource metadata, not the full contents of uploaded documents.</p>
        </div>

        <button type="button" onClick={() => void handleAsk()} disabled={isLoading || !question.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><SendHorizontal size={16}/>{isLoading ? 'Thinking…' : 'Send question'}</button>
        <p className="mt-2 text-xs text-[#71809A]">Press Enter to send · Shift + Enter for a new line</p>
      </div>
    </div>
  </div>;
}
