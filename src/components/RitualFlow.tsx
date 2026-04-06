import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RefreshCw, Download, Hand, PlusCircle, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { SpreadType, TarotCard, Reading } from '../types';
import { TAROT_CARDS } from '../constants';
import { generateTarotInterpretation } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

type Step = 'question' | 'spread' | 'shuffling' | 'selection' | 'interpretation';

export default function RitualFlow() {
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<SpreadType>('trinity');
  const [selectedCards, setSelectedCards] = useState<{ card: TarotCard; isReversed: boolean; position: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);

  const handleStartRitual = () => {
    if (question.trim()) setStep('spread');
  };

  const handleSelectSpread = (type: SpreadType) => {
    setSpread(type);
    setStep('shuffling');
  };

  const handleStopShuffling = () => {
    setStep('selection');
  };

  const handleSelectCard = (card: TarotCard) => {
    const positions = spread === 'single' ? ['Guidance'] : spread === 'trinity' ? ['Past', 'Present', 'Future'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    if (selectedCards.length < positions.length) {
      const isReversed = Math.random() > 0.8; // 20% chance of reversal
      setSelectedCards([...selectedCards, { card, isReversed, position: positions[selectedCards.length] }]);
    }
  };

  const handleReveal = async () => {
    setIsGenerating(true);
    setStep('interpretation');
    const interpretation = await generateTarotInterpretation(question, spread, selectedCards);
    setReading({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      question,
      spread,
      cards: selectedCards,
      interpretation
    });
    setIsGenerating(false);
  };

  return (
    <div className="px-6 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'question' && (
          <motion.div 
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center space-y-12"
          >
            <div className="w-64 h-64 rounded-2xl overflow-hidden border border-primary/20 sacred-glow">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfSExEJVzJ898VMtJP2BzMS8fQpGnhZ6Gj7rTgOegfZdIMRHPJ9u23VRObwsWAvB-cc2sJfaj9ceIHlstyPp1YgLRRDuG2d5iLHJed5Fkrjcp54fR0fp3W5LNBcZcJOchUfRWNEa1BbQnH5KZXH1dSGOhtZUXXOAUI4Ei8xkd3QncnnZKS62GemVmUk8568cT2BUTIz3g4JiqT7a83NuU2iFkmQIjNEPB1LqqpyMWb5qWPehG77JbIpD2kRDtZwgxtrSzN9Pkm96M" 
                alt="Ritual Table"
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-headline text-4xl md:text-5xl font-bold">
                <span className="text-primary">宇宙</span>需要知晓什么？
              </h2>
              <p className="text-on-background/60 tracking-widest uppercase text-sm">聚焦你的能量，述说你的诉求</p>
            </div>
            <div className="w-full max-w-lg bg-surface rounded-2xl p-8 space-y-6">
              <textarea 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="在此输入你的问题..."
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-body placeholder:text-on-background/20 resize-none h-40"
              />
              <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-on-background/40">
                <div className="flex gap-4">
                  <span className="text-primary">既定 // 当下</span>
                  <span>输入 // 手动</span>
                </div>
                <span>{question.length} / 200</span>
              </div>
            </div>
            <button 
              onClick={handleStartRitual}
              disabled={!question.trim()}
              className="bg-primary text-on-primary font-headline font-bold px-16 py-5 rounded-full shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              开启仪式
            </button>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-background/20">
              将为您抽取三张圣牌，开启您的命运探索之旅
            </p>
          </motion.div>
        )}

        {step === 'spread' && (
          <motion.div 
            key="spread"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-label text-xs tracking-widest uppercase text-primary/60">解读进度</span>
                <span className="font-label text-xs tracking-widest text-primary">40%</span>
              </div>
              <div className="h-1 w-full bg-surface-high rounded-full overflow-hidden">
                <div className="h-full w-[40%] bg-primary shadow-[0_0_12px_rgba(233,195,73,0.3)]" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="font-headline text-4xl">选择牌阵</h2>
              <p className="text-on-background/60">选择仪式的结构，每种阵型都揭示了真理的不同维度。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SpreadCard 
                title="Single 单牌指引" 
                subtitle="基础" 
                description="专注于你的意图，让牌组与你的频率对齐。"
                icon="diamond"
                onClick={() => handleSelectSpread('single')}
              />
              <SpreadCard 
                title="Holy Trinity 圣三角" 
                subtitle="神圣" 
                description="过去、现在与未来。经典的三角牌阵，为您提供时间维度的视角。"
                icon="brightness_7"
                featured
                onClick={() => handleSelectSpread('trinity')}
              />
              <SpreadCard 
                title="Celtic Cross 凯尔特十字" 
                subtitle="深度" 
                description="专注于你的意图，让牌组与你的频率对齐。"
                icon="all_inclusive"
                onClick={() => handleSelectSpread('celtic')}
              />
            </div>
          </motion.div>
        )}

        {step === 'shuffling' && (
          <motion.div 
            key="shuffling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center space-y-12 py-20"
          >
            <div className="relative w-full h-64 flex justify-center items-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(233,195,73,0.08)_0%,transparent_70%)]"
              />
              <div className="relative flex items-center justify-center">
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      rotate: [0, i * 10, -i * 10, 0],
                      x: [0, i * 20, -i * 20, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className={cn(
                      "absolute w-40 h-64 bg-surface-high rounded-xl border border-primary/20 shadow-2xl",
                      i === 1 ? "z-30" : i === 2 ? "z-20 opacity-80" : "z-10 opacity-60"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-headline text-2xl">洗牌中</h4>
              <p className="text-on-background/60">专注于你的意图，让牌组与你的频率对齐。</p>
            </div>
            <button 
              onClick={handleStopShuffling}
              className="bg-primary text-on-primary font-label px-12 py-4 rounded-full flex items-center gap-3 hover:shadow-primary/40 transition-all active:scale-95"
            >
              <span className="uppercase tracking-widest font-bold">停止洗牌</span>
              <Hand className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-16"
          >
            <div className="text-center space-y-4">
              <p className="font-label text-primary uppercase tracking-[0.3em] text-xs">
                仪式进度: {selectedCards.length} / {spread === 'single' ? 1 : spread === 'trinity' ? 3 : 10}
              </p>
              <h2 className="font-headline text-4xl md:text-5xl">跟随你的直觉</h2>
              <p className="text-on-background/60 max-w-md mx-auto">
                深呼吸，从下方的牌组中选择牌。专注于你的问题："{question}"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-3xl">
              {spread === 'trinity' && ['过去', '现在', '未来'].map((pos, i) => (
                <div key={pos} className="flex flex-col items-center">
                  <div className={cn(
                    "w-full aspect-[2/3.5] rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all duration-500",
                    selectedCards[i] ? "bg-surface-high border-primary/20 sacred-glow" : "bg-surface border-outline/30"
                  )}>
                    {selectedCards[i] ? (
                      <div className="tarot-card-back w-full h-full p-2">
                        <div className="w-full h-full border border-primary/30 rounded flex items-center justify-center overflow-hidden">
                          <img 
                            src={selectedCards[i].card.image} 
                            alt="Card Back" 
                            className="w-full h-full object-cover opacity-40 grayscale"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : (
                      <PlusCircle className="w-10 h-10 text-outline/40" />
                    )}
                  </div>
                  <span className={cn(
                    "font-label text-[10px] tracking-widest uppercase mt-4",
                    selectedCards[i] ? "text-primary font-bold" : "text-outline"
                  )}>{pos}</span>
                </div>
              ))}
            </div>

            <div className="relative w-full h-64 mt-8 flex justify-center perspective-1000">
              <div className="relative w-full max-w-2xl flex justify-center h-full">
                {Array.from({ length: 11 }).map((_, i) => {
                  const rotation = (i - 5) * 10;
                  const x = (i - 5) * 40;
                  const y = Math.abs(i - 5) * 5;
                  return (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -20 }}
                      onClick={() => handleSelectCard(TAROT_CARDS[i % TAROT_CARDS.length])}
                      className="absolute w-24 h-40 tarot-card-back rounded-lg cursor-pointer shadow-xl"
                      style={{ 
                        rotate: `${rotation}deg`,
                        x,
                        y,
                        zIndex: 10 - Math.abs(i - 5)
                      }}
                    />
                  );
                })}
                <div className="absolute w-28 h-44 tarot-card-back rounded-lg z-20 border-primary/40 sacred-glow -translate-y-4 flex flex-col items-center justify-center opacity-40">
                  <Sun className="w-8 h-8 mb-1" />
                  <span className="font-label text-[8px] tracking-[0.2em] uppercase">选择</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleReveal}
              disabled={selectedCards.length < (spread === 'single' ? 1 : spread === 'trinity' ? 3 : 10)}
              className="bg-primary text-on-primary font-label px-12 py-4 rounded-full flex items-center gap-3 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="uppercase tracking-widest font-bold">揭示真理</span>
            </button>
          </motion.div>
        )}

        {step === 'interpretation' && (
          <motion.div 
            key="interpretation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16"
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-16 h-16 text-primary" />
                </motion.div>
                <p className="font-headline text-2xl animate-pulse">正在沟通星辰...</p>
              </div>
            ) : reading && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reading.cards.map((c, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      <div className="font-label text-xs tracking-widest text-on-background/60 uppercase">
                        位置 {i + 1} // {c.position}
                      </div>
                      <div className={cn(
                        "aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-high sacred-glow transition-transform duration-500 hover:scale-[1.02]",
                        c.isReversed && "border-b-2 border-tertiary"
                      )}>
                        <img 
                          src={c.card.image} 
                          alt={c.card.name} 
                          className={cn("w-full h-full object-cover grayscale-[0.2]", c.isReversed && "rotate-180")}
                          referrerPolicy="no-referrer"
                        />
                        {c.isReversed && (
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="font-label text-[10px] tracking-widest text-tertiary uppercase bg-background/80 backdrop-blur px-2 py-1 rounded">逆位</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-headline text-2xl text-primary mt-2">{c.card.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {c.card.keywords.map(k => (
                          <span key={k} className="font-label text-[10px] tracking-widest bg-surface-high px-3 py-1 rounded-full uppercase border border-outline/10">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-12 mt-24">
                  <div className="max-w-2xl">
                    <h2 className="font-headline text-4xl mb-8 leading-tight">
                      解读已为您开启
                    </h2>
                    <div className="h-[1px] w-24 bg-primary/30 mb-8" />
                  </div>
                  
                  <div className="prose prose-invert max-w-none prose-headings:font-headline prose-p:font-body prose-p:text-on-background/80">
                    <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
                  </div>
                </section>

                <section className="mt-32 p-8 md:p-12 rounded-xl bg-surface border-l-4 border-primary relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <span className="font-label text-[10px] tracking-[0.3em] text-primary uppercase mb-4 block">炼金术士的最终合成</span>
                    <h3 className="font-headline text-3xl mb-6">蜕变需要热量</h3>
                    <p className="font-body text-lg text-on-background/80 max-w-2xl leading-relaxed mb-8">
                      你的占卜揭示了一个强大的精神进化周期。金子就在碎片之中。
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button className="bg-primary text-on-primary font-label text-xs tracking-widest px-8 py-4 rounded-full uppercase hover:shadow-primary/30 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> 保存为图片
                      </button>
                      <button 
                        onClick={() => setStep('question')}
                        className="bg-transparent border border-outline/30 text-on-background font-label text-xs tracking-widest px-8 py-4 rounded-full uppercase hover:bg-surface-high transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> 开启新占卜
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpreadCard({ title, subtitle, description, icon, featured, onClick }: { 
  title: string; 
  subtitle: string; 
  description: string; 
  icon: string;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-surface p-8 rounded-xl transition-all duration-500 hover:bg-surface-high cursor-pointer flex flex-col aspect-[3/4]",
        featured && "border-t-2 border-primary/40 shadow-xl scale-105 z-10"
      )}
    >
      <div className="mb-8">
        <span className={cn("font-label text-[10px] tracking-[0.3em] uppercase mb-2 block", featured ? "text-primary" : "text-primary/50")}>
          {subtitle}
        </span>
        <h3 className="font-headline text-2xl">{title}</h3>
      </div>
      <div className="flex-1 flex items-center justify-center py-6">
        <div className={cn(
          "w-24 h-40 border rounded-lg bg-surface-high/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:shadow-primary/10",
          featured ? "border-primary" : "border-primary/20"
        )}>
          <span className="material-symbols-outlined text-primary/40 text-4xl">{icon}</span>
        </div>
      </div>
      <p className="font-body text-sm text-on-background/60 leading-relaxed mt-6">{description}</p>
    </div>
  );
}
