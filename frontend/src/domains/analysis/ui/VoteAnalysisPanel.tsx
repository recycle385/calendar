import { FormEvent, KeyboardEvent, useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";

import { isApiError } from "../../../shared/api/httpClient";
import { panelClass } from "../../../shared/ui/styles";
import { analyzeVoteResult } from "../api/analysisApi";

interface VoteAnalysisPanelProps {
  slug: string;
  participantToken: string;
  embedded?: boolean;
}

function getAnalysisErrorMessage(error: unknown) {
  if (isApiError(error)) {
    if (error.status === 429) {
      return "질문이 잠시 몰렸어요. 잠시 후 다시 시도해주세요.";
    }

    if (error.status === 401 || error.status === 403) {
      return "이 모임의 투표 현황을 확인할 권한이 없어요.";
    }

    if (error.status === 400 && error.message) {
      return error.message;
    }
  }

  return "답변을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
}

export function VoteAnalysisPanel({
  slug,
  participantToken,
  embedded = false,
}: VoteAnalysisPanelProps) {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(
    null,
  );
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitQuestion = async () => {
    const trimmed = question.trim();

    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSubmittedQuestion(trimmed);
    setAnswer(null);

    try {
      const response = await analyzeVoteResult(
        slug,
        { question: trimmed },
        participantToken,
      );

      setAnswer(response.answer);
      setQuestion("");
    } catch (requestError) {
      setError(getAnalysisErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await submitQuestion();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submitQuestion();
    }
  };

  return (
    <section
      className={
        embedded ? "overflow-hidden" : `${panelClass} overflow-hidden p-4`
      }
    >
      {!embedded && (
        <header className="mb-3 flex items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf5ff] text-brand-500">
            <MessageCircleQuestion aria-hidden="true" size={18} />
          </span>

          <div className="min-w-0">
            <h2 className="m-0 text-[15px] font-black tracking-[-0.025em] text-[#19365e]">
              결과에 질문하기
            </h2>

            <p className="mt-0.5 mb-0 text-[11px] leading-[1.55] text-[#8091a8]">
              현재 투표 현황을 기준으로 답해요.
            </p>
          </div>
        </header>
      )}

      {(submittedQuestion || answer || error || isLoading) && (
        <div className="mb-3 grid max-h-[260px] gap-2.5 overflow-y-auto rounded-xl bg-[#f7faff] p-3">
          {submittedQuestion && (
            <div className="flex justify-end">
              <div className="max-w-[88%] rounded-[14px] rounded-br-[5px] bg-brand-500 px-3 py-2 text-[12px] leading-[1.55] text-white">
                {submittedQuestion}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-[14px] rounded-bl-[5px] border border-[#e2eaf4] bg-white px-3 py-2 text-[12px] leading-[1.55] text-[#7185a2]">
                투표 결과를 확인하고 있어요.
              </div>
            </div>
          )}

          {answer && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-[14px] rounded-bl-[5px] border border-[#e2eaf4] bg-white px-3 py-2 text-[12px] font-medium leading-[1.65] text-[#29496f]">
                {answer}
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-[14px] rounded-bl-[5px] border border-[#f4dfe1] bg-[#fff8f8] px-3 py-2 text-[12px] leading-[1.65] text-[#b84b54]">
                {error}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="flex items-end gap-2 rounded-xl border border-[#dfe8f3] bg-white p-2 transition focus-within:border-[#8abaf3] focus-within:ring-2 focus-within:ring-[#e4f0ff]">
          <textarea
            aria-label="투표 결과 질문"
            className="max-h-24 min-h-[42px] min-w-0 flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-[12px] leading-[1.55] text-[#263f62] outline-none placeholder:text-[#9aa9bc]"
            maxLength={200}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="투표 결과를 물어보세요"
            rows={2}
            value={question}
          />

          <button
            aria-label="질문 보내기"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!question.trim() || isLoading}
            type="submit"
          >
            <Send aria-hidden="true" size={16} />
          </button>
        </div>

        {question.length >= 170 && (
          <p className="mt-1.5 mb-0 text-right text-[10px] text-[#8a9db7]">
            {question.length} / 200
          </p>
        )}
      </form>

      <p className="mt-2.5 mb-0 text-[10px] leading-[1.55] text-[#97a5b8]">
        질문과 답변은 저장되지 않아요. 분석을 위해 가명화된 투표 정보가 외부 AI
        서비스로 전송될 수 있어요.
      </p>
    </section>
  );
}
