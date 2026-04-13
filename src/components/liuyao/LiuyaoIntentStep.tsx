import { motion } from 'motion/react';
import { BookOpen, Coins, Heart, LayoutGrid, Sparkles } from 'lucide-react';

const iconMap: Record<string, typeof BookOpen> = {
  学业功名: BookOpen,
  事业前程: LayoutGrid,
  情缘发展: Heart,
  财运经营: Coins,
  寻物杂项: Sparkles,
};

interface LiuyaoIntentStepProps {
  question: string;
  onQuestionChange: (value: string) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  onBegin: () => void;
  loading: boolean;
}

export default function LiuyaoIntentStep({
  question,
  onQuestionChange,
  category,
  categories,
  onCategoryChange,
  onBegin,
  loading,
}: LiuyaoIntentStepProps) {
  return (
    <motion.section
      key="liuyao-intent"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-3xl border border-[#171817]/10 bg-white/75 p-6 md:p-8"
    >
      <h2 className="cf-kaiti text-3xl md:text-4xl tracking-[0.2em] text-center text-[#171817]">选择事项 描述问题</h2>

      <div className="mt-8 grid grid-cols-5 gap-2 md:gap-4">
        {categories.map((item, idx) => {
          const Icon = iconMap[item] || Sparkles;
          return (
            <motion.button
              key={item}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onCategoryChange(item)}
                className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
                  category === item ? '-translate-y-1.5' : ''
                }`}
            >
              <div
                className={`h-16 w-12 md:h-20 md:w-14 border-x-2 flex items-center justify-center transition ${
                  category === item
                    ? 'border-[#52B788]/45 bg-[#D8F3DC]/50 shadow-md'
                    : 'border-[#171817]/12 hover:border-[#52B788]/35'
                }`}
              >
                <Icon
                  size={24}
                  className={category === item ? 'text-[#52B788]' : 'text-[#171817]/45 group-hover:text-[#171817]/70'}
                />
              </div>
              <span
                className={`text-[10px] md:text-xs tracking-wider font-semibold ${
                  category === item ? 'text-[#52B788]' : 'text-[#171817]/65'
                }`}
              >
                {item}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 max-w-3xl mx-auto text-center">
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full bg-transparent border-0 border-b-2 border-[#171817]/15 focus:ring-0 focus:outline-none focus:border-[#52B788] text-center text-[#171817] text-lg md:text-xl tracking-[0.08em] py-4 placeholder:text-[#171817]/30 resize-none transition-all duration-300"
          placeholder="例：下周二的面试是否顺利"
          rows={2}
        />

        <div className="mt-10">
          <button
            disabled={loading}
            onClick={onBegin}
            className="px-12 md:px-16 py-3.5 bg-[#52B788] text-white text-base md:text-lg tracking-[0.35em] hover:bg-[#40916C] transition-all duration-300 font-bold rounded-lg disabled:opacity-50"
          >
            {loading ? '准备中' : '前往起卦'}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
