import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Hand, PlusCircle, RefreshCw, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { spreadSlotNames } from '../config/spreads';
import { TAROT_CARD_MAP } from '../constants';
import { Reading, ReadingRecord, SpreadType, TarotCard, UserSettings } from '../types';
import { selectCard, shuffleSession, startSession, streamReveal } from '../services/api';

type Step = 'question' | 'spread' | 'shuffling' | 'selection' | 'interpretation';

export default function RitualFlow({
  userId,
  settings,
  onReadingCreated,
}: {
  userId: string;
  settings: UserSettings;
  onReadingCreated: (record: ReadingRecord) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<SpreadType>(settings.defaultSpread);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<{ card: TarotCard; isReversed: boolean; position: string }[]>([]);
  const [remainingDeck, setRemainingDeck] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pickingDeckIndex, setPickingDeckIndex] = useState<number | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState('');
  const fanCount = Math.min(19, remainingDeck.length);
  const fanDeckIndexes = useMemo(() => {
    if (fanCount <= 0) return [] as number[];
    if (fanCount === 1) return [0];
    return Array.from({ length: fanCount }, (_, i) => Math.round((i * (remainingDeck.length - 1)) / (fanCount - 1)));
  }, [fanCount, remainingDeck.length]);

  const slotNames = useMemo(() => spreadSlotNames(spread), [spread]);

  useEffect(() => {
    setSpread(settings.defaultSpread);
  }, [settings.defaultSpread]);

  const handleStartRitual = () => {
    const trimmed = question.trim();
    if (trimmed.length < 1 || trimmed.length > 200) {
      setError('请输入 1-200 字的问题');
      return;
    }
    setError('');
    setStep('spread');
  };

  const handleSelectSpread = async (type: SpreadType) => {
    try {
      setSpread(type);
      const resp = await startSession({ userId, question: question.trim(), spreadType: type });
      setSessionId(resp.sessionId);
      setSelectedCards([]);
      setRemainingDeck([]);
      setStep('shuffling');
    } catch (e) {
      setError((e as Error).message || '启动占卜失败');
    }
  };

  const handleStopShuffling = async () => {
    try {
      await shuffleSession({ userId, sessionId });
      setRemainingDeck(Array.from({ length: 78 }, (_, i) => i));
      setStep('selection');
    } catch (e) {
      setError((e as Error).message || '洗牌失败');
    }
  };

  const handleSelectCard = async (deckIndex: number) => {
    if (isSelecting || selectedCards.length >= slotNames.length) return;
    if (deckIndex < 0 || deckIndex >= remainingDeck.length) return;
    setIsSelecting(true);
    setPickingDeckIndex(deckIndex);
    try {
      // 先给用户一个“抽中该牌”的视觉反馈，再提交后端锁定。
      await new Promise((resolve) => setTimeout(resolve, 260));
      const selected = await selectCard({ userId, sessionId, deckIndex });
      const card = TAROT_CARD_MAP.get(selected.cardId);
      if (!card) throw new Error('牌面数据缺失');
      setSelectedCards((prev) => [...prev, { card, isReversed: selected.isReversed, position: selected.position }]);
      setRemainingDeck((prev) => prev.filter((_, idx) => idx !== deckIndex));
    } catch (e) {
      setError((e as Error).message || '选牌失败');
    } finally {
      setPickingDeckIndex(null);
      setTimeout(() => setIsSelecting(false), 300);
    }
  };

  const handleReveal = async () => {
    setIsGenerating(true);
    setStep('interpretation');
    setError('');
    let interpretationBuffer = '';
    setReading({
      id: 'pending',
      date: new Date().toISOString(),
      question,
      spread,
      cards: selectedCards,
      interpretation: '',
    });

    try {
      await streamReveal({
        userId,
        sessionId,
        onChunk: (chunk) => {
          interpretationBuffer += chunk.replace(/\\n/g, '\n');
          setReading((prev) => (prev ? { ...prev, interpretation: interpretationBuffer } : prev));
        },
        onDone: (record) => {
          setReading({
            id: record.id,
            date: record.createdAt,
            question: record.question,
            spread: record.spreadType,
            cards: record.cards.map((c) => ({
              card: TAROT_CARD_MAP.get(c.cardId)!,
              isReversed: c.isReversed,
              position: c.position,
            })),
            interpretation: record.interpretationText,
          });
          void onReadingCreated(record);
        },
      });
    } catch (e) {
      setError((e as Error).message || '解读失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = () => {
    if (!reading) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e9c349';
    ctx.font = 'bold 44px serif';
    ctx.fillText('春风 · 塔罗解读', 80, 120);

    ctx.fillStyle = '#e5e2e1';
    ctx.font = '28px sans-serif';
    ctx.fillText(`问题：${reading.question}`, 80, 190, 1040);
    ctx.font = '24px sans-serif';
    ctx.fillText(`牌阵：${reading.spread}`, 80, 250);

    let y = 320;
    for (const card of reading.cards) {
      const line = `${card.position} - ${card.card.name}${card.isReversed ? ' (逆位)' : ''}`;
      ctx.fillText(line, 80, y);
      y += 40;
    }

    const text = reading.interpretation.replace(/\s+/g, ' ').slice(0, 300);
    ctx.font = '22px sans-serif';
    ctx.fillText(text, 80, y + 40, 1040);

    const link = document.createElement('a');
    link.download = `taluo-${reading.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const restart = () => {
    setStep('question');
    setSelectedCards([]);
    setReading(null);
    setError('');
  };

  return (
    <div className="px-6 max-w-5xl mx-auto">
      {error ? <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-300 text-sm">{error}</div> : null}
      <AnimatePresence mode="wait">
        {step === 'question' && (
          <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center space-y-12">
            <div className="space-y-4">
              <h2 className="font-headline text-4xl md:text-5xl font-bold">
                <span className="text-primary">宇宙</span>需要知晓什么？
              </h2>
              <p className="text-on-background/60 tracking-widest uppercase text-sm">聚焦你的能量，述说你的诉求</p>
            </div>
            <div className="w-full max-w-lg bg-surface rounded-2xl p-8 space-y-6">
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="在此输入你的问题..." className="w-full bg-transparent border-none focus:ring-0 text-lg font-body placeholder:text-on-background/20 resize-none h-40" />
              <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-on-background/40">
                <span>{question.length} / 200</span>
                <span className={question.trim().length >= 1 ? 'text-primary' : ''}>可输入 1 字起</span>
              </div>
            </div>
            <button onClick={handleStartRitual} className="bg-primary text-on-primary font-headline font-bold px-16 py-5 rounded-full">
              开启仪式
            </button>
          </motion.div>
        )}

        {step === 'spread' && (
          <motion.div key="spread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <h2 className="font-headline text-4xl">选择牌阵</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SpreadCard title="Single 单牌指引" subtitle="基础" description="快速聚焦当前问题" featured={spread === 'single'} onClick={() => void handleSelectSpread('single')} />
              <SpreadCard title="Holy Trinity 圣三角" subtitle="神圣" description="过去/现在/未来的结构化视角" featured={spread === 'trinity'} onClick={() => void handleSelectSpread('trinity')} />
              <SpreadCard title="Celtic Cross 凯尔特十字" subtitle="深度" description="10牌完整全景分析" featured={spread === 'celtic'} onClick={() => void handleSelectSpread('celtic')} />
            </div>
          </motion.div>
        )}

        {step === 'shuffling' && (
          <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center space-y-12 py-20">
            <div className="relative w-full h-64 flex justify-center items-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(233,195,73,0.08)_0%,transparent_70%)]" />
              <div className="relative flex items-center justify-center">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: [0, i * 10, -i * 10, 0], x: [0, i * 20, -i * 20, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className={cn('absolute w-40 h-64 bg-surface-high rounded-xl border border-primary/20 shadow-2xl', i === 1 ? 'z-30' : i === 2 ? 'z-20 opacity-80' : 'z-10 opacity-60')}
                  />
                ))}
              </div>
            </div>
            <button onClick={() => void handleStopShuffling()} className="bg-primary text-on-primary font-label px-12 py-4 rounded-full flex items-center gap-3">
              <span className="uppercase tracking-widest font-bold">停止洗牌</span>
              <Hand className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'selection' && (
          <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center space-y-16">
            <div className="text-center space-y-4">
              <p className="font-label text-primary uppercase tracking-[0.3em] text-xs">
                仪式进度: {selectedCards.length} / {slotNames.length}
              </p>
              <h2 className="font-headline text-4xl md:text-5xl">跟随你的直觉</h2>
            </div>

            <div className={cn('grid gap-6 md:gap-12 w-full max-w-5xl', spread === 'celtic' ? 'grid-cols-5' : spread === 'trinity' ? 'grid-cols-3' : 'grid-cols-1 max-w-xs')}>
              {slotNames.map((pos, i) => (
                <div key={pos} className="flex flex-col items-center">
                  <div className={cn('w-full aspect-[2/3.5] rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all duration-500', selectedCards[i] ? 'bg-surface-high border-primary/20 sacred-glow' : 'bg-surface border-outline/30')}>
                    {selectedCards[i] ? (
                      <img src={selectedCards[i].card.image} alt={selectedCards[i].card.name} className={cn('w-full h-full object-cover opacity-70 grayscale', selectedCards[i].isReversed && 'rotate-180')} referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <PlusCircle className="w-10 h-10 text-outline/40" />
                    )}
                  </div>
                  <span className={cn('font-label text-[10px] tracking-widest uppercase mt-4', selectedCards[i] ? 'text-primary font-bold' : 'text-outline')}>{pos}</span>
                </div>
              ))}
            </div>

            <div className="w-full mt-2">
              <p className="text-center text-xs uppercase tracking-[0.25em] text-on-background/50 mb-4">展开牌列 · 任意抽取</p>
              <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="relative h-[290px] w-[640px] mx-auto">
                  {fanDeckIndexes.map((deckIndex, visualIdx) => {
                    const half = Math.max(1, (fanDeckIndexes.length - 1) / 2);
                    const offset = visualIdx - half;
                    const normalized = offset / half;
                    const x = normalized * 240;
                    const y = Math.pow(Math.abs(normalized), 1.3) * 96;
                    const angle = normalized * 34;
                    const isPicked = pickingDeckIndex === deckIndex;
                    return (
                      <motion.button
                        key={`${deckIndex}-${visualIdx}`}
                        onClick={() => void handleSelectCard(deckIndex)}
                        disabled={(isSelecting && !isPicked) || selectedCards.length >= slotNames.length}
                        className={cn(
                          'absolute left-1/2 top-16 -translate-x-1/2 w-20 h-32 md:w-24 md:h-36 rounded-lg border border-primary/20 shadow-xl transition-all [transform-style:preserve-3d]',
                          isPicked ? 'sacred-glow border-primary' : 'tarot-card-back',
                          'disabled:opacity-45',
                        )}
                        layout
                        initial={false}
                        animate={{
                          x,
                          y: isPicked ? -86 : y,
                          rotate: isPicked ? 0 : angle,
                          rotateY: isPicked ? 180 : 0,
                          scale: isPicked ? 1.12 : 1,
                          opacity: isSelecting && !isPicked ? 0.35 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.68 }}
                        style={{ zIndex: isPicked ? 200 : 100 - Math.abs(offset) }}
                        aria-label={`抽取第 ${deckIndex + 1} 张牌`}
                      >
                        <span className={cn('absolute inset-0 rounded-lg', isPicked ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(233,195,73,0.42),rgba(233,195,73,0.05)_65%,transparent_100%)] animate-pulse' : '')} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={() => void handleReveal()} disabled={selectedCards.length < slotNames.length} className="bg-primary text-on-primary font-label px-12 py-4 rounded-full flex items-center gap-3 disabled:opacity-50">
              <RefreshCw className="w-5 h-5" />
              <span className="uppercase tracking-widest font-bold">揭示真理</span>
            </button>
          </motion.div>
        )}

        {step === 'interpretation' && (
          <motion.div key="interpretation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
            {isGenerating && !reading?.interpretation ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles className="w-16 h-16 text-primary" />
                </motion.div>
                <p className="font-headline text-2xl animate-pulse">正在沟通星辰...</p>
              </div>
            ) : null}

            {reading ? (
              <>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reading.cards.map((c, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      <div className="font-label text-xs tracking-widest text-on-background/60 uppercase">
                        位置 {i + 1} // {c.position}
                      </div>
                      <div className={cn('aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-high sacred-glow', c.isReversed && 'border-b-2 border-tertiary')}>
                        <img src={c.card.image} alt={c.card.name} className={cn('w-full h-full object-cover grayscale-[0.2]', c.isReversed && 'rotate-180')} referrerPolicy="no-referrer" loading="lazy" />
                      </div>
                      <h3 className="font-headline text-2xl text-primary mt-2">{c.card.name}</h3>
                    </div>
                  ))}
                </section>

                <section className="space-y-12 mt-24">
                  <div className="prose prose-invert max-w-none prose-headings:font-headline prose-p:font-body prose-p:text-on-background/80">
                    <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
                  </div>
                </section>

                <section className="mt-16 p-8 rounded-xl bg-surface border-l-4 border-primary">
                  <div className="flex flex-wrap gap-4">
                    <button onClick={handleSaveImage} className="bg-primary text-on-primary font-label text-xs tracking-widest px-8 py-4 rounded-full uppercase hover:shadow-primary/30 transition-all flex items-center gap-2">
                      <Download className="w-4 h-4" /> 保存为图片
                    </button>
                    <button onClick={restart} className="bg-transparent border border-outline/30 text-on-background font-label text-xs tracking-widest px-8 py-4 rounded-full uppercase hover:bg-surface-high transition-all flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> 开启新占卜
                    </button>
                  </div>
                </section>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpreadCard({ title, subtitle, description, featured, onClick }: { title: string; subtitle: string; description: string; featured?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('text-left group relative bg-surface p-8 rounded-xl transition-all duration-500 hover:bg-surface-high cursor-pointer flex flex-col aspect-[3/4]', featured && 'border-t-2 border-primary/40 shadow-xl scale-105 z-10')}>
      <div className="mb-8">
        <span className={cn('font-label text-[10px] tracking-[0.3em] uppercase mb-2 block', featured ? 'text-primary' : 'text-primary/50')}>{subtitle}</span>
        <h3 className="font-headline text-2xl">{title}</h3>
      </div>
      <p className="font-body text-sm text-on-background/60 leading-relaxed mt-6">{description}</p>
    </button>
  );
}
