import InterpretationView from '../common/InterpretationView';
import { TAROT_CARD_MAP } from '../../constants';
import { TarotSelection } from '../../types';

interface TarotResultStepProps {
  interpretation: string;
  loading: boolean;
  recordId: string;
  selected: TarotSelection[];
  followup: string;
  followupAnswer: string;
  onFollowupChange: (value: string) => void;
  onAskFollowup: () => void;
}

export default function TarotResultStep({
  interpretation,
  loading,
  recordId,
  selected,
  followup,
  followupAnswer,
  onFollowupChange,
  onAskFollowup,
}: TarotResultStepProps) {
  return (
    <section className="mt-6 space-y-4">
      {selected.length ? (
        <div className="rounded-2xl cf-panel p-4">
          <div className="text-sm text-[#d9cfb8] mb-2">本次牌阵</div>
          <div className="flex flex-wrap gap-2">
            {selected.map((item, idx) => (
              <span key={`${item.cardId}-${idx}`} className="px-3 py-1 rounded-full text-xs border border-[#75b995]/35 bg-[#75b995]/12 text-[#d7ecdf]">
                {item.position} · {TAROT_CARD_MAP.get(item.cardId)?.name || item.cardId}
                {item.isReversed ? '（逆位）' : '（正位）'}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <InterpretationView mode="tarot" text={interpretation || (loading ? 'AI 正在分析...' : '')} />
      {recordId ? (
        <div className="rounded-2xl cf-panel p-4">
          <div className="text-sm text-[#d9cfb8] mb-2">单张/整体追问</div>
          <div className="flex gap-2">
            <input
              value={followup}
              onChange={(e) => onFollowupChange(e.target.value)}
              placeholder="继续追问"
              className="cf-input flex-1 rounded-lg px-3 py-2"
            />
            <button onClick={onAskFollowup} className="px-3 py-2 rounded-lg cf-btn">
              发送
            </button>
          </div>
          {followupAnswer ? <div className="mt-3 text-[#efe6d4] whitespace-pre-wrap">{followupAnswer}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
