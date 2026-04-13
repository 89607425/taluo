import { Brain, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { LiuyaoCastResult } from '../../types';
import InterpretationView from '../common/InterpretationView';
import { LiuyaoLine } from './LiuyaoLine';

interface LiuyaoResultStepProps {
  cast: LiuyaoCastResult;
  loading: boolean;
  interpretation: string;
  recordId: string;
  followup: string;
  followupAnswer: string;
  onDeepAnalyze: () => void;
  onFollowupChange: (value: string) => void;
  onAskFollowup: () => void;
}

export default function LiuyaoResultStep({
  cast,
  loading,
  interpretation,
  recordId,
  followup,
  followupAnswer,
  onDeepAnalyze,
  onFollowupChange,
  onAskFollowup,
}: LiuyaoResultStepProps) {
  const hasAi = interpretation.trim().length > 0 || !!recordId;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-5">
      <div className="text-center relative">
        <span className="text-sm tracking-[0.2em] text-[#171817]/55 mb-3 block">六爻结果</span>
        <h2 className="cf-kaiti text-5xl md:text-6xl text-[#171817] mb-2">{cast.primary.name}</h2>
        <p className="text-sm text-[#171817]/60">
          变卦：{cast.changed.name}
          {cast.movingLines.length ? ' · 终局参考' : ' · 与本卦一致'}
        </p>
        <div className="mt-4 inline-flex items-center px-6 py-2.5 rounded-full font-medium text-sm tracking-wide bg-[#D8F3DC]/60 text-[#2d6a4f] border border-[#52B788]/30">
          <Sparkles size={16} className="mr-2" />
          吉凶：{cast.primary.fortune} → {cast.changed.fortune}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative w-full aspect-square max-w-[320px] flex items-center justify-center mx-auto"
        >
          <div className="absolute inset-0 rounded-full border-2 border-[#171817]/10 scale-110" />
          <div className="absolute inset-0 rounded-full border border-[#171817]/5 scale-125" />
          <div className="absolute top-4 text-xs tracking-[0.2em] text-[#171817]/50 font-bold">本卦</div>
          <div className="flex flex-col-reverse gap-4 w-full px-8">
            {[...cast.lines].map((line, idx) => (
              <LiuyaoLine key={idx} line={line} moving={cast.movingLines.includes(idx + 1)} index={idx} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full aspect-square max-w-[320px] flex items-center justify-center mx-auto"
        >
          <div className="absolute inset-0 rounded-full border-2 border-[#52B788]/20 scale-110" />
          <div className="absolute inset-0 rounded-full border border-[#52B788]/10 scale-125" />
          <div className="absolute top-4 text-xs tracking-[0.2em] text-[#52B788]/70 font-bold">变卦</div>
          <div className="flex flex-col-reverse gap-4 w-full px-8">
            {[...cast.changed.lines].map((line, idx) => (
              <LiuyaoLine key={idx} line={line} moving={false} index={idx} />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="rounded-xl border border-[#171817]/10 bg-white/70 p-5">
        <h3 className="text-xl font-bold mb-4 text-[#171817]">卦辞</h3>
        <div className="space-y-4">
          <div className="rounded-lg border border-[#171817]/10 bg-white/70 p-4">
            <p className="text-sm text-[#171817]/55 mb-1">本卦 · {cast.primary.name}</p>
            <p className="text-[#171817]/85 leading-relaxed mb-2 text-sm">原文：{cast.primary.judgment}</p>
            <p className="text-[#171817]/75 leading-relaxed text-sm">白话：{cast.primary.summary}</p>
          </div>
          <div className="rounded-lg border border-[#52B788]/20 bg-[#D8F3DC]/25 p-4">
            <p className="text-sm text-[#171817]/55 mb-1">变卦 · {cast.changed.name}</p>
            <p className="text-[#171817]/85 leading-relaxed mb-2 text-sm">原文：{cast.changed.judgment}</p>
            <p className="text-[#171817]/75 leading-relaxed text-sm">白话：{cast.changed.summary}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#171817]/10 bg-white/70 p-5">
        <h3 className="text-lg font-bold mb-3 text-[#52B788] flex items-center gap-2">
          <Brain size={18} /> 深度解读
        </h3>
        <button
          onClick={onDeepAnalyze}
          disabled={loading || hasAi}
          className="group relative px-8 py-3 rounded-full bg-[#52B788] text-white font-bold shadow-lg hover:bg-[#40916C] transition-all disabled:opacity-50"
        >
          {loading ? '生成中...' : hasAi ? '已完成解读' : '生成深度解读'}
        </button>
      </div>

      {hasAi ? <InterpretationView mode="liuyao" text={interpretation || (loading ? 'AI 正在分析...' : '')} /> : null}

      {recordId ? (
        <div className="rounded-2xl border border-[#171817]/10 bg-white/75 p-4">
          <div className="text-sm text-[#171817] mb-2">多轮追问</div>
          <div className="flex gap-2">
            <input
              value={followup}
              onChange={(e) => onFollowupChange(e.target.value)}
              placeholder="继续追问"
              className="flex-1 rounded-lg border border-[#171817]/15 bg-white px-3 py-2 text-[#171817] placeholder:text-[#171817]/40"
            />
            <button onClick={onAskFollowup} className="px-3 py-2 rounded-lg bg-[#52B788] text-white hover:bg-[#40916C] transition-colors">
              发送
            </button>
          </div>
          {followupAnswer ? <div className="mt-3 text-[#171817]/85 whitespace-pre-wrap">{followupAnswer}</div> : null}
        </div>
      ) : null}
    </motion.section>
  );
}
