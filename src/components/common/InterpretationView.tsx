import TypewriterText from './TypewriterText';

export default function InterpretationView({
  mode,
  text,
}: {
  mode: 'liuyao' | 'tarot';
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-300/20 bg-zinc-950/60 p-4 md:p-6">
      <div className="mb-3 text-xs uppercase tracking-[0.25em] text-amber-300/80">
        {mode === 'liuyao' ? '六爻解读' : '塔罗解读'}
      </div>
      <TypewriterText text={text} />
    </section>
  );
}
