import { useState } from 'react';
import { BrainCircuit, SendHorizontal } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';

export function AITutorPage() {
  const [question, setQuestion] = useState('How should I revise for my digital logic exam in the next 48 hours?');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;
    setIsLoading(true); setAnswer('');
    try {
      const response = await sophiaApi.ai.ask({ question: trimmedQuestion });
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
        <button type="button" onClick={handleAsk} disabled={isLoading || !question.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><SendHorizontal size={16}/>{isLoading ? 'Thinking…' : 'Ask Sophis'}</button>
        {answer && <div role="status" aria-live="polite" className="mt-5 whitespace-pre-wrap rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-sm leading-7 text-[#1F2937]">{answer}</div>}
      </div>
    </div>
  </div>;
}
