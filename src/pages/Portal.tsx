import { Link } from 'react-router-dom';

export default function Portal() {
  const guideKey = 'chunfeng:guide_closed';
  const showGuide = !localStorage.getItem(guideKey);

  return (
    <main className="relative min-h-screen px-4 pt-10 pb-32 md:pt-14 cf-star-field">
      <div className="pointer-events-none absolute inset-0 opacity-20 cf-ink-mask">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2400&q=80"
          alt="background"
          className="h-full w-full object-cover grayscale"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {showGuide ? (
          <div className="mb-8 rounded-2xl cf-panel-soft p-4 md:p-5">
            <div className="text-sm text-[#cfe8db]">欢迎来到「玄机」：你可以在同一入口完成六爻与塔罗的完整解读流程。</div>
            <button
              className="mt-3 rounded-full px-4 py-1.5 text-xs cf-btn-ghost"
              onClick={() => {
                localStorage.setItem(guideKey, '1');
                window.location.reload();
              }}
            >
              关闭引导
            </button>
          </div>
        ) : null}

        <div className="rounded-3xl cf-panel p-8 md:p-10 text-center">
          <img src="/mountain-ink.svg" alt="ink mountain" className="mx-auto mb-4 w-28 opacity-70" />
          <h1 className="cf-kaiti text-5xl md:text-7xl tracking-[0.3em] text-[#f2e8cf]">玄机</h1>
          <p className="mt-4 text-sm md:text-base tracking-[0.25em] text-[#c5d7cd]">遇事不决可问春风</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#c8c3b9]/85">
            以六爻观结构，以塔罗看情境。一个入口，双路径，同一套历史与追问能力。
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            to="/liuyao"
            className="group rounded-3xl cf-panel p-6 md:p-8 min-h-[300px] flex flex-col justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-[0.34em] text-[#b9cfc3]">Xin Yi · LiuYao</div>
              <div className="mt-3 cf-kaiti text-5xl text-[#e9d89f]">心易</div>
              <div className="mt-2 text-sm text-[#cfd8d2]">三枚铜钱，六次成卦，先得本卦再看变卦走势。</div>
            </div>
            <div className="text-sm text-[#9fd3b7] group-hover:text-[#d1e8dc]">进入心易流程 →</div>
          </Link>

          <Link
            to="/tarot"
            className="group rounded-3xl cf-panel p-6 md:p-8 min-h-[300px] flex flex-col justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-[0.34em] text-[#b9cfc3]">Tarot · Ritual</div>
              <div className="mt-3 cf-kaiti text-5xl text-[#e9d89f]">塔罗</div>
              <div className="mt-2 text-sm text-[#cfd8d2]">单牌 / 三牌 / 凯尔特十字，支持完整牌阵追问。</div>
            </div>
            <div className="text-sm text-[#9fd3b7] group-hover:text-[#d1e8dc]">进入塔罗流程 →</div>
          </Link>
        </div>

        <div className="mt-8 flex justify-center text-2xl leaf-float">🍃</div>
      </div>
    </main>
  );
}
