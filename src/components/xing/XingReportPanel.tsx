type Props = {
  visible: boolean;
};

const modules = [
  {
    title: '核心人格驱动力',
    content: '太阳 + 上升 + 守护星，说明你做决定的第一反应与长期自我塑造路径。',
  },
  {
    title: '情感与关系模式',
    content: '金星 / 火星 / 第7宫，解释吸引类型、关系冲突模式与亲密边界。',
  },
  {
    title: '职业与天赋',
    content: '第10宫 / 土星 / 北交点，输出可执行的职业策略与节奏建议。',
  },
  {
    title: '心理底层模式',
    content: '月亮 / 冥王星 / 凯龙星，聚焦情绪触发、阴影课题与修复路径。',
  },
];

export default function XingReportPanel({ visible }: Props) {
  if (!visible) return null;

  return (
    <section className="rounded-3xl cf-panel p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.34em] text-[#9fb9ff]">Layered Report</div>
      <h3 className="mt-2 text-2xl cf-kaiti text-[#ecedff]">分层解读报告</h3>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {modules.map((m) => (
          <article key={m.title} className="rounded-2xl border border-[#5a66a3]/40 bg-[#12162b]/80 p-4">
            <h4 className="text-base text-[#eef0ff]">{m.title}</h4>
            <p className="mt-1 text-sm text-[#cfd7ff]">{m.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
