import { Link } from 'react-router-dom';

export default function Portal() {
  const guideKey = 'chunfeng:guide_closed';
  const showGuide = !localStorage.getItem(guideKey);

  return (
    <main className="min-h-screen px-4 py-10 md:py-16 flex flex-col items-center bg-stars">
      {showGuide ? (
        <div className="mb-6 max-w-xl rounded-2xl border border-amber-200/30 bg-amber-100/10 p-4 text-amber-100">
          <div className="text-sm">欢迎来到「玄机」：选择心易或塔罗，2 步即可发起占卜。</div>
          <button
            className="mt-3 text-xs px-3 py-1 rounded-full border border-amber-200/40"
            onClick={() => {
              localStorage.setItem(guideKey, '1');
              window.location.reload();
            }}
          >
            关闭引导
          </button>
        </div>
      ) : null}

      <h1 className="text-3xl md:text-5xl text-amber-100 font-serif tracking-[0.2em] mb-8">玄机</h1>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/liuyao"
          className="group min-h-[320px] rounded-3xl border border-emerald-300/30 bg-gradient-to-b from-emerald-950/80 to-zinc-950/80 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Xin Yi</div>
            <div className="mt-3 text-4xl text-emerald-100 font-serif">心易</div>
            <div className="mt-2 text-emerald-200/80">六爻占卜</div>
          </div>
          <div className="text-sm text-emerald-100/70 group-hover:text-emerald-100">进入心易流程 →</div>
        </Link>

        <Link
          to="/tarot"
          className="group min-h-[320px] rounded-3xl border border-violet-300/30 bg-gradient-to-b from-violet-950/80 to-zinc-950/80 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-violet-200/70">Tarot</div>
            <div className="mt-3 text-4xl text-violet-100 font-serif">塔罗</div>
            <div className="mt-2 text-violet-200/80">多牌阵解读</div>
          </div>
          <div className="text-sm text-violet-100/70 group-hover:text-violet-100">进入塔罗流程 →</div>
        </Link>
      </div>
    </main>
  );
}
