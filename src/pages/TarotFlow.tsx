import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CardFlip from '../components/common/CardFlip';
import InterpretationView from '../components/common/InterpretationView';
import {
  fetchTarotSettings,
  followupQuestion,
  getToken,
  saveTarotSettings,
  selectTarotCard,
  shuffleTarotSession,
  startTarotSession,
  streamReveal,
} from '../services/api';
import { SpreadType, TarotSelection } from '../types';

const spreads: Array<{ id: SpreadType; label: string; desc: string; count: number }> = [
  { id: 'single', label: '单牌', desc: '快速指引', count: 1 },
  { id: 'trinity', label: '三牌', desc: '过去/现在/未来', count: 3 },
  { id: 'celtic', label: '凯尔特十字', desc: '完整结构解读', count: 10 },
];

type Step = 'setup' | 'draw' | 'result';

export default function TarotFlow() {
  const [step, setStep] = useState<Step>('setup');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<SpreadType>('trinity');
  const [reverseEnabled, setReverseEnabled] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [selected, setSelected] = useState<TarotSelection[]>([]);
  const [requiredCount, setRequiredCount] = useState(3);
  const [interpretation, setInterpretation] = useState('');
  const [recordId, setRecordId] = useState('');
  const [followup, setFollowup] = useState('');
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    void (async () => {
      if (!token) return;
      try {
        const settings = await fetchTarotSettings();
        setReverseEnabled(settings.reverseEnabled);
      } catch {
        // ignore
      }
    })();
  }, [token]);

  async function begin() {
    setError('');
    const text = question.trim();
    if (!token) {
      setError('请先登录后再占卜');
      return;
    }
    if (!text || text.length > 100) {
      setError('请输入 1-100 字问题');
      return;
    }

    setLoading(true);
    try {
      await saveTarotSettings({ reverseEnabled });
      const started = await startTarotSession({
        question: text,
        spreadType: spread,
        reverseEnabled,
      });
      await shuffleTarotSession({ sessionId: started.sessionId });
      setSessionId(started.sessionId);
      setSelected([]);
      setRequiredCount(spreads.find((item) => item.id === spread)?.count || 3);
      setStep('draw');
      setInterpretation('');
      setRecordId('');
      setFollowupAnswer('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function pick(index: number) {
    if (!sessionId || selected.length >= requiredCount || loading) return;
    setLoading(true);
    setError('');
    try {
      const resp = await selectTarotCard({ sessionId, deckIndex: index });
      setSelected((prev) => [...prev, { cardId: resp.cardId, position: resp.position, isReversed: resp.isReversed }]);
      setRequiredCount(resp.totalCount);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function analyze() {
    if (!sessionId || selected.length !== requiredCount) return;
    setLoading(true);
    setError('');
    setInterpretation('');
    setStep('result');

    try {
      await streamReveal({
        url: `/api/tarot/sessions/${sessionId}/reveal-stream`,
        onChunk: (chunk) => setInterpretation((prev) => prev + chunk),
        onDone: (record) => setRecordId(record.id),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function askFollowup() {
    if (!recordId || !followup.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await followupQuestion({ recordId, question: followup.trim() });
      setFollowupAnswer(resp.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-6 pb-28">
      <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回首页</Link>
      <h1 className="mt-4 text-3xl font-serif text-emerald-900">塔罗占卜</h1>

      {step === 'setup' ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl spring-panel p-4">
            <div className="text-sm text-emerald-800 mb-2">占卜问题</div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入你的问题（1-100字）"
              className="w-full h-24 rounded-xl bg-white border border-emerald-200 p-3"
            />
          </div>

          <div className="rounded-2xl spring-panel p-4">
            <div className="text-sm text-emerald-800 mb-2">牌阵模式</div>
            <div className="space-y-2">
              {spreads.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-xl border p-3 text-left ${spread === item.id ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200 bg-white'}`}
                  onClick={() => setSpread(item.id)}
                >
                  <div className="text-emerald-900">{item.label}</div>
                  <div className="text-xs text-emerald-600">{item.desc} · {item.count} 张</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl spring-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-800">逆位设置</div>
                <div className="text-xs text-emerald-600">开启后会出现正逆位解读</div>
              </div>
              <button
                onClick={() => setReverseEnabled((v) => !v)}
                className={`h-8 w-14 rounded-full border ${reverseEnabled ? 'border-emerald-400 bg-emerald-100' : 'border-emerald-300 bg-white'}`}
              >
                <div className={`h-6 w-6 rounded-full bg-emerald-600 transition ${reverseEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <button disabled={loading} onClick={() => void begin()} className="w-full py-3 rounded-xl spring-btn text-white">
            {loading ? '准备中...' : '进入抽牌'}
          </button>
        </section>
      ) : null}

      {step === 'draw' ? (
        <section className="mt-6 rounded-2xl spring-panel p-4">
          <div className="text-sm text-emerald-800 mb-3">从牌堆抽牌：{selected.length}/{requiredCount}</div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => void pick(idx)}
                disabled={selected.length >= requiredCount || loading}
                className="h-16 rounded-lg border border-emerald-300/50 bg-gradient-to-b from-emerald-100 to-white text-[10px] text-emerald-700"
              >
                牌堆
              </button>
            ))}
          </div>

          {selected.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.map((item, idx) => (
                <div key={`${item.cardId}-${idx}`}>
                  <div className="text-[10px] text-emerald-600 mb-1">{item.position}</div>
                  <CardFlip cardId={item.cardId} isReversed={item.isReversed} />
                </div>
              ))}
            </div>
          ) : null}

          <button
            disabled={loading || selected.length !== requiredCount}
            onClick={() => void analyze()}
            className="mt-4 w-full py-3 rounded-xl spring-btn text-white disabled:opacity-40"
          >
            分析牌阵
          </button>
        </section>
      ) : null}

      {step === 'result' ? (
        <section className="mt-6 space-y-4">
          <InterpretationView mode="tarot" text={interpretation || (loading ? 'AI 正在分析...' : '')} />
          {recordId ? (
            <div className="rounded-2xl spring-panel p-4">
              <div className="text-sm text-emerald-800 mb-2">单张/整体追问</div>
              <div className="flex gap-2">
                <input
                  value={followup}
                  onChange={(e) => setFollowup(e.target.value)}
                  placeholder="继续追问"
                  className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2"
                />
                <button onClick={() => void askFollowup()} className="px-3 py-2 rounded-lg spring-btn">发送</button>
              </div>
              {followupAnswer ? <div className="mt-3 text-emerald-900 whitespace-pre-wrap">{followupAnswer}</div> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
    </main>
  );
}
