import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import RitualFlow from './components/RitualFlow';
import Settings from './components/Settings';
import History from './components/History';
import { ReadingRecord, UserSettings } from './types';
import { clearHistory, fetchHistory, fetchSettings, getClientUserId, saveSettings } from './services/api';

const defaultSettings: UserSettings = {
  userId: '',
  reverseEnabled: true,
  defaultSpread: 'trinity',
  interpretationStyle: 'detailed',
  themeStyle: 'dark',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('ritual');
  const [userId, setUserId] = useState('');
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [history, setHistory] = useState<ReadingRecord[]>([]);

  useEffect(() => {
    const id = getClientUserId();
    setUserId(id);
    Promise.all([fetchSettings(id), fetchHistory(id)])
      .then(([remoteSettings, records]) => {
        setSettings(remoteSettings);
        setHistory(records);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-fresh', settings.themeStyle === 'fresh');
  }, [settings.themeStyle]);

  async function reloadHistory(currentUserId: string) {
    const records = await fetchHistory(currentUserId);
    setHistory(records);
  }

  async function handleSettingsChange(next: UserSettings) {
    setSettings(next);
    try {
      const saved = await saveSettings(next);
      // Keep the user's just-selected theme to avoid UI flicker/revert
      // when backend returns a stale/missing theme field.
      setSettings({ ...saved, themeStyle: next.themeStyle });
    } catch {
      // Keep optimistic local state if save fails.
      setSettings(next);
    }
  }

  async function handleRecordCreated(record: ReadingRecord) {
    setHistory((prev) => [record, ...prev].slice(0, 30));
    await reloadHistory(userId);
  }

  async function handleClearHistory() {
    await clearHistory(userId);
    await reloadHistory(userId);
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        {activeTab === 'ritual' && userId && <RitualFlow key="ritual" userId={userId} settings={settings} onReadingCreated={handleRecordCreated} />}
        {activeTab === 'history' && <History key="history" records={history} onClear={handleClearHistory} />}
        {activeTab === 'settings' && userId && <Settings key="settings" value={settings} onChange={handleSettingsChange} />}
      </AnimatePresence>
    </Layout>
  );
}
