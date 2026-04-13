import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CardFlip from '../components/common/CardFlip';
import { TAROT_CARD_MAP } from '../constants';
import { fetchHistoryDetail, getToken } from '../services/api';
import { DivinationRecord, LiuyaoCastResult } from '../types';

function renderLine(line: number, key: string) {
  const isYang = line === 1 || line === 3;
  return isYang ? (
    <div key={key} className="h-2.5 rounded bg-[#e9e4db]" />
  ) : (
    <div key={key} className="flex gap-3">
      <div className="h-2.5 flex-1 rounded bg-[#e9e4db]" />
      <div className="h-2.5 flex-1 rounded bg-[#e9e4db]" />
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
      <main className="min-h-screen max-w-xl mx-auto px-4 pt-8 pb-28">
        <Link to="/history" className="text-sm text-[#9fd3b7] hover:text-[#d0e6da]">← 返回历史</Link>
        <div className="mt-6 rounded-2xl cf-panel p-4 text-[#d9cfb8]">
          登录已失效，请先去 <Link to="/profile" className="text-[#9fd3b7] underline">个人中心</Link> 重新登录。
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-8 pb-28">
      <Link to="/history" className="text-sm text-[#9fd3b7] hover:text-[#d0e6da]">← 返回历史</Link>

      {error ? <div className="mt-6 text-[#ffb7b7]">{error}</div> : null}
      {!record && !error ? <div className="mt-6 text-[#b8cfc2]">加载中...</div> : null}

      {record ? (
        <>
          <h1 className="mt-4 text-3xl cf-kaiti text-[#ecdca8]">{record.question}</h1>
          <div className="text-[#acc9ba] text-sm mt-1">{new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}</div>

          {record.type === 'liuyao' ? (
            <section className="mt-5 rounded-2xl cf-panel p-4">
              {(() => {
                const cast = record.rawData as unknown as LiuyaoCastResult;
                return (
                  <>
                    <div className="text-sm text-[#d9cfb8]">本卦：{cast.primary?.name} · 变卦：{cast.changed?.name}</div>
                    <div className="mt-3 grid grid-cols-2 gap-5">
                      <div className="space-y-2">{[...(cast.lines || [])].reverse().map((line, idx) => renderLine(line, `l-${idx}`))}</div>
                      <div className="space-y-2">{[...(cast.changed?.lines || [])].reverse().map((line, idx) => renderLine(line, `c-${idx}`))}</div>
                    </div>
                  </>
                );
              })()}
            </section>
          ) : (
            <section className="mt-5 rounded-2xl cf-panel p-4">
              <div className="flex flex-wrap gap-3">
                {((record.rawData.selected || []) as Array<{ cardId: string; isReversed: boolean; position: string }>).map((item, idx) => (
                  <div key={`${item.cardId}-${idx}`}>
                    <div className="text-xs text-[#b8cfc2] mb-1">{item.position}</div>
                    <CardFlip cardId={item.cardId} isReversed={item.isReversed} />
                    <div className="text-[11px] text-[#acc9ba] mt-1">{TAROT_CARD_MAP.get(item.cardId)?.name || item.cardId}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 rounded-2xl cf-panel p-4 whitespace-pre-wrap text-[#efe6d4] leading-7">
            {record.interpretation}
          </section>
        </>
      ) : null}
    </main>
  );
}
