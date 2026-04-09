import { motion } from 'motion/react';
import { Sparkles, SlidersHorizontal, Wand2 } from 'lucide-react';
import { SpreadType, UserSettings } from '../types';

export default function Settings({
  value,
  onChange,
}: {
  value: UserSettings;
  onChange: (next: UserSettings) => Promise<void>;
}) {
  return (
    <motion.div
      key="settings-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="max-w-4xl mx-auto px-6 space-y-8"
    >
      <header className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface p-8 sacred-glow">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="font-label text-xs tracking-[0.25em] uppercase text-primary/80">Ritual Control</p>
            <h1 className="font-headline text-4xl mt-2">占卜设置</h1>
            <p className="text-on-background/60 mt-3">统一你的占卜节奏、牌阵偏好与解读风格。</p>
          </div>
          <Sparkles className="text-primary w-7 h-7" />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="w-5 h-5" />
            <h2 className="font-headline text-2xl">核心配置</h2>
          </div>

          <label className="flex items-center justify-between rounded-xl bg-surface-high/70 px-4 py-4 border border-white/5">
            <div>
              <p className="font-headline text-lg">逆位开关</p>
              <p className="text-xs text-on-background/55 mt-1">关闭后，所有牌只显示正位</p>
            </div>
            <input
              type="checkbox"
              checked={value.reverseEnabled}
              onChange={(e) => {
                void onChange({ ...value, reverseEnabled: e.target.checked });
              }}
              className="h-5 w-5 accent-[#e9c349]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-on-background/60">默认牌阵</span>
            <select
              className="w-full bg-surface-high rounded-xl p-3 border border-white/10 focus:border-primary outline-none"
              value={value.defaultSpread}
              onChange={(e) => {
                void onChange({ ...value, defaultSpread: e.target.value as SpreadType });
              }}
            >
              <option value="single">单牌指引</option>
              <option value="trinity">圣三角</option>
              <option value="celtic">凯尔特十字</option>
            </select>
          </label>
        </div>

        <div className="bg-surface border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Wand2 className="w-5 h-5" />
            <h2 className="font-headline text-2xl">解读风格</h2>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-on-background/60">输出模式</span>
            <select
              className="w-full bg-surface-high rounded-xl p-3 border border-white/10 focus:border-primary outline-none"
              value={value.interpretationStyle}
              onChange={(e) => {
                void onChange({ ...value, interpretationStyle: e.target.value as 'brief' | 'detailed' });
              }}
            >
              <option value="detailed">详细解读</option>
              <option value="brief">简洁解读</option>
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-sm text-on-background/60">界面风格</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-high p-1 border border-white/10">
              <button
                className={`rounded-lg py-2 text-sm transition-colors ${value.themeStyle === 'dark' ? 'bg-primary text-on-primary' : 'text-on-background/70 hover:text-primary'}`}
                onClick={() => {
                  void onChange({ ...value, themeStyle: 'dark' });
                }}
              >
                黑暗风
              </button>
              <button
                className={`rounded-lg py-2 text-sm transition-colors ${value.themeStyle === 'fresh' ? 'bg-primary text-on-primary' : 'text-on-background/70 hover:text-primary'}`}
                onClick={() => {
                  void onChange({ ...value, themeStyle: 'fresh' });
                }}
              >
                清新风
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-surface-high/70 border border-white/5 p-4 text-sm text-on-background/65 leading-relaxed">
            当前偏好会自动持久化，下次进入直接生效。
          </div>
        </div>
      </section>
    </motion.div>
  );
}
