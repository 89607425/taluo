import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Moon, Sun, Volume2, Trash2, ChevronRight, Share2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      <header className="px-6 py-4 border-b border-white/5 flex items-center">
        <button onClick={onClose} className="p-2 -ml-2 text-primary">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="flex-1 text-center font-headline text-xl text-primary tracking-tight">Settings</h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-12 hide-scrollbar">
        <section className="space-y-6">
          <header>
            <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary mb-2">Divination Settings</p>
            <div className="h-px w-8 bg-primary/30" />
          </header>
          <div className="bg-surface rounded-xl overflow-hidden">
            <SettingToggle title="逆位开关" description="开启后，抽牌可能出现正位或逆位" defaultChecked />
            <SettingSelect title="解读风格" value="详细解读" />
            <SettingSelect title="默认牌阵" value="圣三角" />
          </div>
        </section>

        <section className="space-y-6">
          <header>
            <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary mb-2">Ritual Atmosphere</p>
            <div className="h-px w-8 bg-primary/30" />
          </header>
          <div className="space-y-4">
            <label className="font-headline text-lg px-1">占卜主题</label>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              <ThemeCard 
                title="默认主题" 
                active 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuD6yqQTEFYUrw0h13pXd4YjVuRRe9PWODUYntYLuCcy_O8-heHhwRtQGuyEay1DXfX6Ww3I_KGmEPZRBy-C9yqxWPJrM9HMtKSCIKfECzjcG2Mg9A-VN5VEqRxWlCqxhAq6_d1Doc1oYEhXVx6dVa1RIYRbC-u5WSPJqt_RoD7R2cLxwP6ejM_Y48fsMRjGgoqe4R_2_2ep3-71Dqlno2OdA4FcvE9IX9wNUqQbu6jodwIVs_RVvA4GBqjSSFZ3QtRyFQubatr192g" 
              />
              <ThemeCard 
                title="星辰主题" 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuAKi-HZ0GbGd7lrSepqCYX6BNDE0ZiiStiOIeIhvqx6vbm-9DY46O7yNpbznS4iKCpGiFdVicPeX1HPftULOSWd9YVd_qh4HvXXlnvmS2VSWbGHSjaGlN_gYvvezm90mbOiRnpjm2Ny_Ic1wEolgw18uHMwFc8kzOz59-WhugBZVJD0C3kSNcUaSzCaziRki80aZpjb3jlI5LjZnXdmH9n9jWhXuK1H5BjvHrEZuvOX5RxJmPDvi__ip8V0n0WteTfO2H8-JWniz8U" 
              />
            </div>
          </div>
          <div className="bg-surface rounded-xl p-5 space-y-6">
            <SettingToggle title="背景音乐" />
            <div className="space-y-3 opacity-50">
              <div className="flex justify-between font-label text-[10px] text-on-background/40 uppercase tracking-widest">
                <span>Volume</span>
                <span>0%</span>
              </div>
              <div className="h-1 w-full bg-surface-high rounded-full overflow-hidden">
                <div className="h-full w-0 bg-primary" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <header>
            <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary mb-2">Data Management</p>
            <div className="h-px w-8 bg-primary/30" />
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataCard title="历史记录" value="已存储 12 条记录" action="清空记录" />
            <DataCard title="缓存管理" value="12.5 MB" action="清理缓存" />
          </div>
        </section>

        <footer className="py-12 flex flex-col items-center space-y-2 opacity-20">
          <p className="font-label text-[11px] uppercase tracking-widest">Version 1.0.0</p>
          <p className="font-label text-[11px] uppercase tracking-widest">The Digital Alchemist • 2024</p>
        </footer>
      </main>
    </motion.div>
  );
}

function SettingToggle({ title, description, defaultChecked }: { title: string; description?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-surface-high transition-colors">
      <div className="space-y-1">
        <span className="font-headline text-lg">{title}</span>
        {description && <p className="text-sm text-on-background/40">{description}</p>}
      </div>
      <div className={cn(
        "w-11 h-6 rounded-full relative transition-colors",
        defaultChecked ? "bg-primary" : "bg-surface-high"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-on-primary transition-all",
          defaultChecked ? "left-6" : "left-1"
        )} />
      </div>
    </div>
  );
}

function SettingSelect({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-surface-high transition-colors cursor-pointer">
      <span className="font-headline text-lg">{title}</span>
      <div className="flex items-center gap-2 text-primary">
        <span className="text-sm font-label tracking-wide">{value}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}

function ThemeCard({ title, image, active }: { title: string; image: string; active?: boolean }) {
  return (
    <div className={cn(
      "flex-shrink-0 w-40 h-48 rounded-xl p-4 flex flex-col justify-between border transition-all cursor-pointer",
      active ? "bg-surface-high border-primary/20 sacred-glow" : "bg-surface border-white/5"
    )}>
      <div className="w-full h-24 rounded-lg overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-headline", active ? "text-primary" : "text-on-background/60")}>{title}</span>
        {active && <Sun className="w-4 h-4 text-primary" />}
      </div>
    </div>
  );
}

function DataCard({ title, value, action }: { title: string; value: string; action: string }) {
  return (
    <div className="bg-surface rounded-xl p-5 flex flex-col justify-between space-y-4">
      <div>
        <span className="font-headline text-lg block mb-1">{title}</span>
        <p className="text-sm text-primary font-label">{value}</p>
      </div>
      <button className="w-full py-2.5 rounded-full border border-white/10 text-xs font-label uppercase tracking-widest text-on-background/40 hover:border-primary/50 hover:text-primary transition-all">
        {action}
      </button>
    </div>
  );
}
