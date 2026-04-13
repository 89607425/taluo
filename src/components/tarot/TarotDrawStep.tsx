import { motion } from 'motion/react';
import CardFlip from '../common/CardFlip';
import { TarotSelection } from '../../types';

interface LastDraw {
  cardId: string;
  cardName: string;
  position: string;
  isReversed: boolean;
}

interface TarotDrawStepProps {
  selected: TarotSelection[];
  requiredCount: number;
  loading: boolean;
  deckCount: number;
  shuffled: boolean;
  lastDraw: LastDraw | null;
  onShuffle: () => void;
  onPick: () => void;
  onAnalyze: () => void;
}

export default function TarotDrawStep({
  selected,
  requiredCount,
  loading,
  deckCount,
  shuffled,
  lastDraw,
  onShuffle,
  onPick,
  onAnalyze,
}: TarotDrawStepProps) {
  return (
    <section className="mt-6 rounded-3xl cf-panel p-5 md:p-8">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-[#acc9ba] uppercase">Tarot Ritual</p>
        <h2 className="mt-2 cf-kaiti text-3xl md:text-4xl text-[#ecdca8]">洗牌与抽牌</h2>
        <p className="mt-2 text-sm text-[#c7c2b8]">
          进度 {selected.length}/{requiredCount} · 剩余牌数 {deckCount}
        </p>
      </div>

      <div className="mt-7 flex flex-col items-center gap-5">
        <div className="relative w-56 h-80 sm:w-64 sm:h-96">
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -3 }}
            onClick={onPick}
            disabled={!shuffled || selected.length >= requiredCount || loading}
            className="absolute inset-0 rounded-2xl border border-[#d7b86c]/30 shadow-2xl overflow-hidden disabled:opacity-45"
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(215,184,108,0.3), transparent 44%), linear-gradient(160deg, #242d36 0%, #141a20 100%)',
            }}
          >
            <motion.div
              animate={{
                rotate: loading ? [0, -4, 4, -3, 0] : [0, 0],
                x: loading ? [0, -3, 3, -2, 0] : [0, 0],
              }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            />
            <div className="absolute inset-4 rounded-xl border border-[#d7b86c]/20" />
            <div className="absolute inset-10 rounded-xl border border-[#75b995]/20" />
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs tracking-[0.25em] text-[#d9cfb3]">
              {shuffled ? '点击抽一张' : '先洗牌'}
            </div>
          </motion.button>

          <div className="absolute -right-4 -bottom-4 flex gap-1">
            <div className="w-10 h-14 rounded-md border border-[#d7b86c]/25 bg-[#1a222a]" />
            <div className="w-10 h-14 rounded-md border border-[#d7b86c]/20 bg-[#141a20]" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onShuffle}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl cf-btn-ghost disabled:opacity-50"
          >
            {shuffled ? '重新洗牌' : '洗一次牌'}
          </button>
          <button
            onClick={onPick}
            disabled={!shuffled || selected.length >= requiredCount || loading}
            className="px-6 py-2.5 rounded-xl cf-btn disabled:opacity-45"
          >
            抽牌
          </button>
        </div>
      </div>

      {lastDraw ? (
        <motion.div
          key={`${lastDraw.cardId}-${selected.length}`}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-6 rounded-xl border border-[#75b995]/35 bg-[#75b995]/10 p-3 text-center"
        >
          <div className="text-xs tracking-[0.2em] text-[#acc9ba]">刚刚抽到</div>
          <div className="mt-1 text-[#efe6d4] font-semibold">{lastDraw.cardName}</div>
          <div className="text-xs text-[#c7c2b8]">
            {lastDraw.position} · {lastDraw.isReversed ? '逆位' : '正位'}
          </div>
        </motion.div>
      ) : null}

      {selected.length ? (
        <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
          {selected.map((item, idx) => (
            <div key={`${item.cardId}-${idx}`}>
              <div className="text-[10px] text-[#b8cfc2] mb-1">{item.position}</div>
              <CardFlip cardId={item.cardId} isReversed={item.isReversed} />
            </div>
          ))}
        </div>
      ) : null}

      <button
        disabled={loading || selected.length !== requiredCount}
        onClick={onAnalyze}
        className="mt-5 w-full py-3 rounded-xl cf-btn disabled:opacity-40"
      >
        分析牌阵
      </button>
    </section>
  );
}

