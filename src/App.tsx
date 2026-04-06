import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import RitualFlow from './components/RitualFlow';
import Journal from './components/Journal';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('ritual');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      <AnimatePresence mode="wait">
        {activeTab === 'ritual' && <RitualFlow key="ritual" />}
        {activeTab === 'journal' && <Journal key="journal" />}
        {activeTab === 'history' && (
          <div key="history" className="flex items-center justify-center h-96 text-on-background/20 font-headline text-2xl">
            暂无历史记录
          </div>
        )}
        {activeTab === 'profile' && (
          <div key="profile" className="flex items-center justify-center h-96 text-on-background/20 font-headline text-2xl">
            灵魂档案建设中
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <Settings onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
