export default function LiuyaoHomeStep({ onStart }: { onStart: () => void }) {
  return (
    <section className="mt-6 rounded-3xl border border-[#171817]/10 bg-white/70 p-7 text-center">
      <div className="text-xs tracking-[0.3em] text-[#52B788]/80 uppercase">Xin Yi Ritual</div>
      <h1 className="mt-3 text-4xl cf-kaiti text-[#171817]">六爻起卦</h1>
      <p className="mt-3 text-sm text-[#171817]/65">静心凝神，先起卦，再问事。</p>
      <button
        className="mt-8 w-full py-4 rounded-2xl bg-[#52B788] text-white text-lg font-semibold hover:bg-[#40916C] transition-colors"
        onClick={onStart}
      >
        开始起卦
      </button>
    </section>
  );
}
