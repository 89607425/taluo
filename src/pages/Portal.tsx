import { Link } from 'react-router-dom';

export default function Portal() {
  const guideKey = 'chunfeng:guide_closed';
  const showGuide = !localStorage.getItem(guideKey);

  return (
    <main className="min-h-screen px-4 py-10 md:py-16 flex flex-col items-center bg-stars">
      <img src="/mountain-ink.svg" alt="ink mountain" className="w-28 opacity-70 mb-2" />
      {showGuide ? (
        <div className="mb-6 max-w-xl rounded-2xl spring-panel p-4 text-emerald-800">
          <div className="text-sm">欢迎来到「玄机」：遇事不决，可问春风。</div>
          <button
            className="mt-3 text-xs px-3 py-1 rounded-full spring-btn-ghost"
            onClick={() => {
              localStorage.setItem(guideKey, '1');
              window.location.reload();
            }}
          >
            关闭引导
          </button>
        </div>
      ) : null}

      <h1 className="text-3xl md:text-5xl text-emerald-900 font-serif tracking-[0.2em] mb-2">玄机</h1>
      <p className="text-sm text-emerald-700/80 tracking-[0.2em] mb-8">遇事不决可问春风</p>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/liuyao"
          className="group min-h-[320px] rounded-3xl spring-panel p-6 flex flex-col justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-500/70">Xin Yi</div>
            <div className="mt-3 text-4xl text-emerald-900 font-serif">心易</div>
            <div className="mt-2 text-emerald-700/90">六爻占卜</div>
          </div>
          <div className="text-sm text-emerald-700/80 group-hover:text-emerald-900">进入心易流程 →</div>
        </Link>

        <Link
          to="/tarot"
          className="group min-h-[320px] rounded-3xl spring-panel p-6 flex flex-col justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-500/70">Tarot</div>
            <div className="mt-3 text-4xl text-emerald-900 font-serif">塔罗</div>
            <div className="mt-2 text-emerald-700/90">多牌阵解读</div>
          </div>
          <div className="text-sm text-emerald-700/80 group-hover:text-emerald-900">进入塔罗流程 →</div>
        </Link>
      </div>

      <div className="mt-8 text-2xl leaf-float opacity-70">🍃</div>
    </main>
  );
}
