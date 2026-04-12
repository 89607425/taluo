import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CardFlip from '../components/common/CardFlip';
import { TAROT_CARD_MAP } from '../constants';
import { fetchHistoryDetail, getToken } from '../services/api';
import { DivinationRecord, LiuyaoCastResult } from '../types';

function renderLine(line: number, key: string) {
  const isYang = line === 1 || line === 3;
  return isYang ? (
    <div key={key} className="h-2.5 rounded bg-zinc-100" />
  ) : (
    <div key={key} className="flex gap-3">
      <div className="h-2.5 flex-1 rounded bg-zinc-100" />
      <div className="h-2.5 flex-1 rounded bg-zinc-100" />
    </div>
  );
}

export default function HistoryDetail() {
  const [record, setRecord] = useState<DivinationRecord | null>(null);
  const [error, setError] = useState('');
  const { id = '' } = useParams();
  const token = getToken();

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHistoryDetail({ id });
        setRecord(data);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    if (token) void load();
  }, [id, token]);

  if (!token) {
    return (
      <main className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-28">
        <Link to="/history" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回历史</Link>
        <div className="mt-6 rounded-2xl spring-panel p-4 text-emerald-800">
          登录已失效，请先去 <Link to="/profile" className="text-emerald-700 underline">个人中心</Link> 重新登录。
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-28">
      <Link to="/history" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回历史</Link>

      {error ? <div className="mt-6 text-red-600">{error}</div> : null}
      {!record && !error ? <div className="mt-6 text-emerald-600">加载中...</div> : null}

      {record ? (
        <>
          <h1 className="mt-4 text-2xl font-serif text-emerald-900">{record.question}</h1>
          <div className="text-emerald-600 text-sm mt-1">{new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}</div>

          {record.type === 'liuyao' ? (
            <section className="mt-5 rounded-2xl spring-panel p-4">
              {(() => {
                const cast = record.rawData as unknown as LiuyaoCastResult;
                return (
                  <>
                    <div className="text-sm text-emerald-800">本卦：{cast.primary?.name} · 变卦：{cast.changed?.name}</div>
                    <div className="mt-3 grid grid-cols-2 gap-5">
                      <div className="space-y-2">{[...(cast.lines || [])].reverse().map((line, idx) => renderLine(line, `l-${idx}`))}</div>
                      <div className="space-y-2">{[...(cast.changed?.lines || [])].reverse().map((line, idx) => renderLine(line, `c-${idx}`))}</div>
                    </div>
                  </>
                );
              })()}
            </section>
          ) : (
            <section className="mt-5 rounded-2xl spring-panel p-4">
              <div className="flex flex-wrap gap-3">
                {((record.rawData.selected || []) as Array<{ cardId: string; isReversed: boolean; position: string }>).map((item, idx) => (
                  <div key={`${item.cardId}-${idx}`}>
                    <div className="text-xs text-emerald-600 mb-1">{item.position}</div>
                    <CardFlip cardId={item.cardId} isReversed={item.isReversed} />
                    <div className="text-[11px] text-emerald-600 mt-1">{TAROT_CARD_MAP.get(item.cardId)?.name || item.cardId}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 rounded-2xl spring-panel p-4 whitespace-pre-wrap text-emerald-900/95 leading-7">
            {record.interpretation}
          </section>
        </>
      ) : null}
    </main>
  );
}
