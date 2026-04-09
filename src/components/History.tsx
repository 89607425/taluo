import { useState } from 'react';
import { X } from 'lucide-react';
import { TAROT_CARD_MAP } from '../constants';
import { ReadingRecord } from '../types';

export default function History({
  records,
  onClear,
}: {
  records: ReadingRecord[];
  onClear: () => Promise<void>;
}) {
  const [selectedRecord, setSelectedRecord] = useState<ReadingRecord | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface p-8 sacred-glow">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div>
          <h1 className="font-headline text-4xl font-bold">历史记录</h1>
          <p className="text-sm text-on-background/50 mt-2">最多保留 30 条，超出后自动删除最早记录</p>
        </div>
        <div className="mt-5">
          <button
            className="px-4 py-2 rounded-full border border-white/20 text-xs tracking-widest uppercase hover:border-primary hover:text-primary"
            onClick={() => {
              void onClear();
            }}
          >
            清空历史
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-on-background/30 font-headline text-2xl bg-surface rounded-2xl border border-white/5">暂无历史记录</div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <button
              key={record.id}
              className="w-full text-left bg-surface rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-colors"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex justify-between text-xs text-on-background/50 mb-3">
                <span>{new Date(record.createdAt).toLocaleString()}</span>
                <span>{record.spreadType}</span>
              </div>
              <h3 className="font-headline text-xl mb-2">{record.question}</h3>
              <p className="text-sm text-on-background/80 line-clamp-3">{record.interpretationText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {record.cards.map((card) => (
                  <span key={`${record.id}-${card.position}`} className="text-[10px] uppercase tracking-widest bg-surface-high px-3 py-1 rounded-full">
                    {card.position} · {TAROT_CARD_MAP.get(card.cardId)?.name || card.cardId}
                    {card.isReversed ? ' (逆位)' : ''}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedRecord ? (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm p-4 md:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-surface rounded-2xl border border-primary/20 p-6 md:p-8 sacred-glow">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs tracking-widest uppercase text-primary/70">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                <h2 className="font-headline text-3xl mt-2">{selectedRecord.question}</h2>
              </div>
              <button
                className="p-2 rounded-full border border-white/15 hover:border-primary/50 text-on-background/70 hover:text-primary"
                onClick={() => setSelectedRecord(null)}
                aria-label="关闭详情"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedRecord.cards.map((card) => (
                <span key={`${selectedRecord.id}-detail-${card.position}`} className="text-[10px] uppercase tracking-widest bg-surface-high px-3 py-1 rounded-full border border-white/10">
                  {card.position} · {TAROT_CARD_MAP.get(card.cardId)?.name || card.cardId}
                  {card.isReversed ? ' (逆位)' : ''}
                </span>
              ))}
            </div>

            <div className="whitespace-pre-wrap text-on-background/90 leading-relaxed">{selectedRecord.interpretationText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
