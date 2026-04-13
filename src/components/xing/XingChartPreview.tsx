type Planet = {
  symbol: string;
  name: string;
  sign: string;
  degree: string;
  house: string;
  retrograde?: boolean;
};

type Props = {
  visible: boolean;
  timeUnknown: boolean;
};

const planets: Planet[] = [
  { symbol: '☉', name: '太阳', sign: '天秤座', degree: "12°40'", house: '第10宫' },
  { symbol: '☽', name: '月亮', sign: '摩羯座', degree: "03°18'", house: '第1宫' },
  { symbol: '☿', name: '水星', sign: '处女座', degree: "14°03'", house: '第10宫', retrograde: true },
  { symbol: '♀', name: '金星', sign: '天蝎座', degree: "20°55'", house: '第11宫' },
  { symbol: '♂', name: '火星', sign: '双子座', degree: "07°11'", house: '第7宫' },
  { symbol: '♃', name: '木星', sign: '水瓶座', degree: "09°26'", house: '第2宫' },
];

export default function XingChartPreview({ visible, timeUnknown }: Props) {
  if (!visible) return null;

  return (
    <section className="rounded-3xl cf-panel p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-[#9fb9ff]">Interactive SVG Chart</div>
          <h3 className="mt-2 text-2xl cf-kaiti text-[#ecedff]">交互式星盘</h3>
        </div>
        <div className="rounded-xl border border-[#6b74ac]/40 bg-[#14172b] px-3 py-2 text-xs text-[#cfd6ff]">分宫制：P Placidus</div>
      </div>

      <div className="mt-5 flex justify-center">
        <svg viewBox="0 0 360 360" className="h-[320px] w-[320px] max-w-full">
          <defs>
            <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1E3A" />
              <stop offset="100%" stopColor="#12162B" />
            </linearGradient>
          </defs>
          <circle cx="180" cy="180" r="165" fill="url(#ring)" stroke="#3f4a7e" strokeWidth="1.5" />
          <circle cx="180" cy="180" r="132" fill="none" stroke="#5662a4" strokeWidth="1" />
          <circle cx="180" cy="180" r="100" fill="none" stroke="#7682cf" strokeWidth="0.8" opacity="0.8" />

          <line x1="180" y1="48" x2="180" y2="312" stroke="#6e79b8" strokeWidth="1" />
          <line x1="48" y1="180" x2="312" y2="180" stroke="#6e79b8" strokeWidth="1" />
          <line x1="86" y1="86" x2="274" y2="274" stroke="#6e79b8" strokeWidth="1" />
          <line x1="274" y1="86" x2="86" y2="274" stroke="#6e79b8" strokeWidth="1" />

          <line x1="114" y1="130" x2="240" y2="205" stroke="#6EE7F2" strokeWidth="1.2" />
          <line x1="142" y1="247" x2="250" y2="141" stroke="#FF6B6B" strokeWidth="1.2" />
          <line x1="95" y1="214" x2="260" y2="240" stroke="#A78BFA" strokeWidth="1.2" />

          <text x="180" y="30" fill="#e8e8ff" textAnchor="middle" fontSize="16">星盘预览</text>
          <text x="108" y="128" fill="#e8e8ff" fontSize="18">☉</text>
          <text x="240" y="206" fill="#e8e8ff" fontSize="18">☽</text>
          <text x="140" y="250" fill="#e8e8ff" fontSize="18">☿</text>
          <text x="252" y="144" fill="#e8e8ff" fontSize="18">♀</text>
          <text x="95" y="220" fill="#e8e8ff" fontSize="18">♂</text>
          <text x="258" y="245" fill="#e8e8ff" fontSize="18">♃</text>
        </svg>
      </div>

      <div className="mt-4 rounded-2xl border border-[#6b74ac]/40 bg-[#111427]/65 p-4 text-xs text-[#cad2ff]">
        <div>相位颜色：合相 `#6EE7F2`｜冲相 `#FF6B6B`｜三分 `#A78BFA`</div>
        {timeUnknown ? <div className="mt-2 text-[#ffd7a8]">时间未知模式：已隐藏上升点/宫位细解，仅展示行星与星座。</div> : null}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
        {planets.map((p) => (
          <div key={p.name} className="rounded-xl border border-[#58639f]/40 bg-[#12162b]/80 px-3 py-2 text-sm text-[#e6e9ff]">
            {p.symbol} {p.name} · {p.sign} {p.degree} {p.retrograde ? '℞' : ''} · {p.house}
          </div>
        ))}
      </div>
    </section>
  );
}
