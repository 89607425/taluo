import React from 'react';
import { Sparkles, History, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-headline text-xl font-bold text-primary tracking-[0.2em] uppercase">
            Spring Breeze
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-28">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-white/5 rounded-t-2xl shadow-2xl">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavButton 
            active={activeTab === 'ritual'} 
            onClick={() => onTabChange('ritual')}
            icon={<Sparkles className="w-6 h-6" />}
            label="占卜"
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => onTabChange('history')}
            icon={<History className="w-6 h-6" />}
            label="历史"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => onTabChange('settings')}
            icon={<Settings className="w-6 h-6" />}
            label="设置"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 transition-all duration-300 rounded-2xl",
        active ? "text-primary bg-surface-high scale-110" : "text-on-background/40 hover:text-primary"
      )}
    >
      {icon}
      <span className="font-label text-[10px] tracking-widest mt-1 uppercase">{label}</span>
    </button>
  );
}
