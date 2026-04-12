import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteHistoryRecord, fetchHistory, getToken } from '../services/api';
import { DivinationRecord } from '../types';

export default function HistoryList() {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'liuyao' | 'tarot'>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = getToken();

  async function load() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const list = await fetchHistory({ type: filter, q });
      setRecords(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filter]);

  async function remove(id: string) {
    await deleteHistoryRecord({ id });
    await load();
  }

  if (!token) {
    return (
      <main className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-28">
        <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回首页</Link>
        <div className="mt-6 rounded-2xl spring-panel p-4 text-emerald-800">
          请先前往 <Link to="/profile" className="text-emerald-700 underline">个人中心登录</Link> 后查看历史。
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-28">
      <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回首页</Link>
      <h1 className="mt-4 text-3xl font-serif text-emerald-900">历史记录</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {['all', 'liuyao', 'tarot'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item as 'all' | 'liuyao' | 'tarot')}
            className={`px-3 py-1 rounded-full border text-xs ${filter === item ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-emerald-200 text-emerald-600'}`}
          >
            {item === 'all' ? '全部' : item === 'liuyao' ? '六爻' : '塔罗'}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索问题关键词" className="flex-1 rounded-xl bg-white border border-emerald-200 px-3 py-2" />
        <button onClick={() => void load()} className="px-3 py-2 rounded-xl spring-btn-ghost">搜索</button>
      </div>

      {loading ? <div className="mt-6 text-emerald-600">加载中...</div> : null}
      {error ? <div className="mt-6 text-red-600">{error}</div> : null}

      <div className="mt-5 space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-2xl spring-panel p-4">
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span>{record.type === 'liuyao' ? '六爻' : '塔罗'}</span>
              <span>{new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
            </div>
            <div className="mt-2 text-emerald-950">{record.question}</div>
            <div className="mt-2 text-emerald-700 line-clamp-2 text-sm">{record.interpretation}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => navigate(`/history/${record.id}`)} className="px-2.5 py-1.5 rounded-lg spring-btn text-white text-xs">查看详情</button>
              <button onClick={() => void remove(record.id)} className="px-2.5 py-1.5 rounded-lg spring-btn-ghost text-xs">删除</button>
            </div>
          </div>
        ))}
        {!records.length && !loading ? <div className="text-emerald-600/80">暂无记录</div> : null}
      </div>
    </main>
  );
}
