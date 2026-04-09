import { useEffect, useMemo, useState } from 'react';
import { Note, ReadingRecord } from '../types';
import { fetchNotes, saveNote } from '../services/api';

export default function Journal({ userId, records }: { userId: string; records: ReadingRecord[] }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const latestRecord = useMemo(() => records[0], [records]);

  useEffect(() => {
    let mounted = true;
    fetchNotes(userId)
      .then((items) => {
        if (mounted) setNotes(items);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    const note = await saveNote({
      userId,
      readingId: latestRecord?.id,
      title: title.trim(),
      content: content.trim(),
      tags: [],
    });
    setNotes((prev) => [note, ...prev]);
    setTitle('');
    setContent('');
  }

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      <header>
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-2">灵感笔记</h1>
        <p className="font-label text-primary/60 text-sm tracking-[0.2em] uppercase">Inspiration Note</p>
      </header>

      <div className="bg-surface rounded-xl p-5 text-sm text-on-background/70">
        关联占卜：{latestRecord ? `${latestRecord.question}（${new Date(latestRecord.createdAt).toLocaleString()}）` : '暂无可关联记录'}
      </div>

      <section className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-0 border-b border-white/10 focus:border-primary focus:ring-0 font-headline text-2xl py-4" placeholder="输入笔记标题..." />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-surface rounded-xl border-0 focus:ring-1 focus:ring-primary/20 p-8 font-body text-lg leading-relaxed h-72 resize-none shadow-inner"
          placeholder="在这里记录你的直觉与感悟..."
        />
        <button onClick={() => void handleSave()} className="bg-primary text-on-primary font-headline font-bold px-12 py-4 rounded-full">
          保存笔记
        </button>
      </section>

      <section className="space-y-4 pb-20">
        <h2 className="font-headline text-2xl">最近笔记</h2>
        {notes.length === 0 ? (
          <p className="text-on-background/40">暂无笔记</p>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="bg-surface rounded-xl p-5">
              <div className="text-xs text-on-background/50 mb-2">{new Date(note.date).toLocaleString()}</div>
              <h3 className="font-headline text-xl mb-2">{note.title}</h3>
              <p className="text-on-background/80 whitespace-pre-wrap">{note.content}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
