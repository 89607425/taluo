import { FormEvent } from 'react';

type Props = {
  name: string;
  date: string;
  time: string;
  city: string;
  timezone: string;
  timeUnknown: boolean;
  loading: boolean;
  onChange: (patch: Partial<{ name: string; date: string; time: string; city: string; timezone: string; timeUnknown: boolean }>) => void;
  onSubmit: () => Promise<void> | void;
};

export default function XingBirthForm({
  name,
  date,
  time,
  city,
  timezone,
  timeUnknown,
  loading,
  onChange,
  onSubmit,
}: Props) {
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={submit} className="rounded-3xl cf-panel p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.34em] text-[#9fb9ff]">Astro · Natal</div>
      <h2 className="mt-2 text-3xl cf-kaiti text-[#e8e8ff]">星盘信息录入</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm text-[#d6defa]">
          昵称
          <input
            className="mt-2 w-full rounded-xl px-3 py-2 cf-input"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="例如：小风"
          />
        </label>

        <label className="text-sm text-[#d6defa]">
          出生日期
          <input
            type="date"
            className="mt-2 w-full rounded-xl px-3 py-2 cf-input"
            value={date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </label>

        <label className="text-sm text-[#d6defa]">
          出生时间
          <input
            type="time"
            className="mt-2 w-full rounded-xl px-3 py-2 cf-input"
            value={time}
            disabled={timeUnknown}
            onChange={(e) => onChange({ time: e.target.value })}
          />
        </label>

        <label className="text-sm text-[#d6defa]">
          时区
          <select
            className="mt-2 w-full rounded-xl px-3 py-2 cf-select"
            value={timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
            <option value="Europe/London">Europe/London (UTC+0/+1)</option>
          </select>
        </label>

        <label className="text-sm text-[#d6defa] md:col-span-2">
          出生城市
          <input
            className="mt-2 w-full rounded-xl px-3 py-2 cf-input"
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="例如：上海"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-[#d6defa]">
        <input type="checkbox" checked={timeUnknown} onChange={(e) => onChange({ timeUnknown: e.target.checked })} />
        我不清楚出生时间（默认按 12:00）
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold cf-btn"
      >
        {loading ? '计算中…' : '生成本命盘'}
      </button>
    </form>
  );
}
