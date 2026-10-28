
import { useState } from 'react';
import { BrainCircuit, SendHorizonal } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';

export function AITutorPage() {
  const [question, setQuestion] = useState(
    'How should I revise for my digital logic exam in the next 48 hours?',
  );
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    setIsLoading(true);
    setAnswer('');

    try {
      const response = await sophiaApi.ai.ask({
        question: trimmedQuestion,
      });

      setAnswer(response.answer);
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? `Unable to get a response from Sophis AI: ${error.message}`
          : 'Unable to get a response from Sophis AI. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="AI tutor" title="Ask Sophis" />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <OverviewCard title="Study support" action="Always on">
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-1 flex items-center gap-2 text-violet-200">
                <BrainCircuit size={16} />
                <span>Suggested prompts</span>
              </div>

              <ul className="mt-3 space-y-2 text-slate-300">
                <li>• Summarize this chapter in 5 key points.</li>
                <li>• Give me a 48-hour revision plan.</li>
                <li>• Explain why this concept is important for exams.</li>
              </ul>
            </div>
          </div>
        </OverviewCard>

        <div className="glass-panel p-5">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Your question</span>

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask Sophis a study question..."
              className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-violet-400"
            />
          </label>

          <button
            type="button"
            onClick={handleAsk}
            disabled={isLoading || !question.trim()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendHorizonal size={16} />
            {isLoading ? 'Thinking...' : 'Ask Sophis'}
          </button>

          {answer ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm leading-7 text-slate-200"
            >
              {answer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}