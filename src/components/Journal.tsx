import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Plus, Download, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Journal() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-6">
      <header className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-2">灵感笔记</h1>
        <p className="font-label text-primary/60 text-sm tracking-[0.2em] uppercase">Inspiration Note</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-white/10 focus:border-primary focus:ring-0 font-headline text-2xl py-4 placeholder:text-on-background/20 transition-colors"
            placeholder="输入笔记标题..."
          />
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-surface rounded-xl border-0 focus:ring-1 focus:ring-primary/20 p-8 font-body text-lg leading-relaxed placeholder:text-on-background/20 h-96 resize-none shadow-inner"
            placeholder="在这里记录你的直觉与感悟..."
          />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface p-6 rounded-xl space-y-4">
            <h3 className="font-label text-xs tracking-widest text-primary/60 uppercase">关联占卜</h3>
            <div className="flex items-center gap-4 group cursor-pointer hover:bg-surface-high p-3 rounded-lg transition-colors">
              <div className="w-16 h-24 rounded-md bg-surface-high border border-primary/20 flex items-center justify-center relative overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWZ7VTEA3rON7QEC5asoy316QvFmLn5qItldUdnr1Z--SNmOB0mVYcI5at3rMgO1QxezcYkztzkHQxiMcwfgLcgDrfkvCP8Xb6hs2HDUN8baNQnfFClKEl5lNQtS_pEGAJKMWuCG0mb9hw-lht7KNsQMvStsDyVwl84roIO1FgXnwa7KgEJ2WF7-XnRzfkBKj8VJS8t8INElGIjWACctKPdnJ2HzHXQ8FEFQs58E5TxgB5uZ3tAzG4A5ouEb69b4JlDGWeGf8R_-A" 
                  alt="Tarot Card"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale"
                  referrerPolicy="no-referrer"
                />
                <Star className="w-5 h-5 text-primary z-10 fill-primary" />
              </div>
              <div>
                <p className="font-headline text-sm font-bold">XVII · 星辰</p>
                <p className="font-label text-[10px] text-on-background/40">2023.10.24 阅读记录</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-label text-xs tracking-widest text-primary/60 uppercase">关联标签</h3>
            <div className="flex flex-wrap gap-2">
              {['情感', '事业', '灵性', '健康'].map(tag => (
                <button key={tag} className={cn(
                  "px-5 py-2 rounded-full border font-label text-xs transition-all",
                  tag === '灵性' ? "border-primary text-primary bg-primary/5" : "border-white/10 hover:border-primary hover:text-primary"
                )}>
                  {tag}
                </button>
              ))}
              <button className="p-2 rounded-full border border-white/10 text-on-background/40 hover:text-primary transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfSExEJVzJ898VMtJP2BzMS8fQpGnhZ6Gj7rTgOegfZdIMRHPJ9u23VRObwsWAvB-cc2sJfaj9ceIHlstyPp1YgLRRDuG2d5iLHJed5Fkrjcp54fR0fp3W5LNBcZcJOchUfRWNEa1BbQnH5KZXH1dSGOhtZUXXOAUI4Ei8xkd3QncnnZKS62GemVmUk8568cT2BUTIz3g4JiqT7a83NuU2iFkmQIjNEPB1LqqpyMWb5qWPehG77JbIpD2kRDtZwgxtrSzN9Pkm96M" 
              alt="Atmosphere"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-[10px] font-label text-primary/40 uppercase tracking-widest leading-tight">
              "Your intuition is the sacred whisper of the soul."
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 flex justify-center">
        <button className="bg-primary text-on-primary font-headline font-bold px-12 py-5 rounded-full shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
          <SparklesIcon className="w-5 h-5" />
          保存笔记
        </button>
      </footer>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
