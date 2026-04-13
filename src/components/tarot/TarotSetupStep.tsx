import { SpreadType } from '../../types';

interface SpreadOption {
  id: SpreadType;
  label: string;
  desc: string;
  count: number;
}

interface TarotSetupStepProps {
  question: string;
  onQuestionChange: (value: string) => void;
  spreads: SpreadOption[];
  spread: SpreadType;
  onSpreadChange: (value: SpreadType) => void;
  reverseEnabled: boolean;
  onToggleReverse: () => void;
  loading: boolean;
  onBegin: () => void;
}

export default function TarotSetupStep({
  question,
  onQuestionChange,
  spreads,
  spread,
  onSpreadChange,
  reverseEnabled,
  onToggleReverse,
  loading,
  onBegin,
}: TarotSetupStepProps) {
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-2xl cf-panel p-4">
        <div className="text-sm text-[#d9cfb8] mb-2">占卜问题</div>
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="输入你的问题（1-100字）"
          className="cf-textarea w-full h-24 rounded-xl p-3"
        />
      </div>

      <div className="rounded-2xl cf-panel p-4">
        <div className="text-sm text-[#d9cfb8] mb-2">牌阵模式</div>
        <div className="space-y-2">
          {spreads.map((item) => (
            <button
              key={item.id}
              className={`w-full rounded-xl border p-3 text-left transition ${
                spread === item.id
                  ? 'border-[#75b995] bg-[#75b995]/15 text-[#d8ecdf]'
                  : 'border-[#d7b86c]/30 bg-[#13181d] text-[#d6d0c3]'
              }`}
              onClick={() => onSpreadChange(item.id)}
            >
              <div>{item.label}</div>
              <div className="text-xs text-[#b8cfc2]">
                {item.desc} · {item.count} 张
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl cf-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[#d9cfb8]">逆位设置</div>
            <div className="text-xs text-[#b8cfc2]">开启后会出现正逆位解读</div>
          </div>
          <button
            onClick={onToggleReverse}
            className={`h-8 w-14 rounded-full border transition ${
              reverseEnabled ? 'border-[#75b995] bg-[#75b995]/20' : 'border-[#d7b86c]/40 bg-[#11161b]'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full bg-[#e5d5a6] transition ${
                reverseEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <button disabled={loading} onClick={onBegin} className="w-full py-3 rounded-xl cf-btn">
        {loading ? '准备中...' : '进入抽牌'}
      </button>
    </section>
  );
}

