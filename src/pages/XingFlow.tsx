import { useState } from 'react';
import XingBirthForm from '../components/xing/XingBirthForm';
import XingChartPreview from '../components/xing/XingChartPreview';
import XingReportPanel from '../components/xing/XingReportPanel';

type BirthState = {
  name: string;
  date: string;
  time: string;
  city: string;
  timezone: string;
  timeUnknown: boolean;
};

export default function XingFlow() {
  const [form, setForm] = useState<BirthState>({
    name: '',
    date: '',
    time: '12:00',
    city: '',
    timezone: 'Asia/Shanghai',
    timeUnknown: false,
  });
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!form.date) {
      setError('请填写出生日期');
      return;
    }
    if (!form.city.trim()) {
      setError('请填写出生城市');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    setReady(true);
  }

  return (
    <main className="min-h-screen px-4 py-8 pb-28">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-[#5f6cad]/45 bg-[#101328]/90 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.34em] text-[#9fb9ff]">XingPan Module</div>
              <h1 className="mt-1 text-4xl cf-kaiti text-[#eef0ff]">星</h1>
              <p className="mt-2 text-sm text-[#cbd3ff]">输入出生信息后，即可生成你的个人星盘与解读。</p>
            </div>
          </div>
        </section>

        <XingBirthForm
          name={form.name}
          date={form.date}
          time={form.time}
          city={form.city}
          timezone={form.timezone}
          timeUnknown={form.timeUnknown}
          loading={loading}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSubmit={handleSubmit}
        />

        {error ? (
          <div className="rounded-xl border border-[#f08d8d]/50 bg-[#321f25] px-4 py-3 text-sm text-[#ffd5d5]">{error}</div>
        ) : null}

        <XingChartPreview visible={ready} timeUnknown={form.timeUnknown} />
        <XingReportPanel visible={ready} />
      </div>
    </main>
  );
}
