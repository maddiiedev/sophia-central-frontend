import { useEffect, useState } from 'react';
import { BrainCircuit, SendHorizontal, Download } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import type { Resource } from '../types';

export function AITutorPage() {
  const [question, setQuestion] = useState('How should I revise for my digital logic exam in the next 48 hours?');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
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

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;
    setIsLoading(true); setAnswer('');
    try {
      const response = await sophiaApi.ai.ask({ question: trimmedQuestion, ...(selectedResourceId ? { resourceId: selectedResourceId } : {}) });
      setAnswer(response.answer);
    } catch (error) {
      setAnswer(error instanceof Error ? `Unable to get a response from Sophis AI: ${error.message}` : 'Unable to get a response from Sophis AI. Please try again.');
    } finally { setIsLoading(false); }
  };

  return <div className="space-y-6">
    <SectionTitle eyebrow="AI tutor" title="Ask Sophis" />
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <OverviewCard title="Study support" action="Always on">
        <div className="space-y-4 text-sm text-[#374151]">
          <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><div className="mb-1 flex items-center gap-2 font-semibold text-[#6121D0]"><BrainCircuit size={16}/><span>Suggested prompts</span></div><ul className="mt-3 space-y-2 text-[#4B5563]"><li>• Summarize this chapter in 5 key points.</li><li>• Give me a 48-hour revision plan.</li><li>• Explain why this concept is important for exams.</li></ul></div>
        </div>
      </OverviewCard>
      <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-[#091F5B]"><span className="mb-2 block">Your question</span><textarea value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask Sophis a study question..." className="min-h-28 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 font-normal text-[#091F5B] outline-none placeholder:text-[#71809A] focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/20"/></label>
        <div className="mt-4 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3">
          <label htmlFor="ai-downloaded-resource" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#091F5B]"><Download size={16} className="text-[#6121D0]"/>Add material from downloaded resources <span className="font-normal text-[#71809A]">(optional)</span></label>
          <select id="ai-downloaded-resource" value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} className="w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/20">
            <option value="">Ask without adding a material</option>
            {downloadedResources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
          </select>
          <p className="mt-2 text-xs text-[#5C6982]">Adding a downloaded resource is optional. Ask Sophis AI with your question alone, or select a downloaded material to provide extra context for its search, analysis, and response.</p>
        </div>
        <button type="button" onClick={handleAsk} disabled={isLoading || !question.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><SendHorizontal size={16}/>{isLoading ? 'Thinking…' : 'Ask Sophis'}</button>
        {answer && <div role="status" aria-live="polite" className="mt-5 whitespace-pre-wrap rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-sm leading-7 text-[#1F2937]">{answer}</div>}
      </div>
    </div>
  </div>;
}
