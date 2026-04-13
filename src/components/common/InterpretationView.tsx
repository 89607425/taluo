import TypewriterText from './TypewriterText';

export default function InterpretationView({
  mode,
  text,
}: {
  mode: 'liuyao' | 'tarot';
  text: string;
}) {
  const isLiuyao = mode === 'liuyao';
  return (
    <section className={isLiuyao ? 'rounded-2xl border border-[#171817]/10 bg-white/75 p-4 md:p-6' : 'rounded-2xl cf-panel p-4 md:p-6'}>
      <div className={`mb-3 text-xs uppercase tracking-[0.25em] ${isLiuyao ? 'text-[#171817]/55' : 'text-[#acc9ba]'}`}>
        {mode === 'liuyao' ? '六爻解读' : '塔罗解读'}
      </div>
      <div className={isLiuyao ? 'text-[#171817]/85' : 'text-[#efe6d4]'}>
        <TypewriterText text={text} />
      </div>
    </section>
  );
}
