import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InterpretationView from '../components/common/InterpretationView';
import { castLiuyao, followupQuestion, getToken, startLiuyaoSession, streamReveal } from '../services/api';
import { LiuyaoCastResult } from '../types';

const categories = ['学业功名', '事业前程', '情缘发展', '财运经营', '寻物杂项'];

type Step = 'home' | 'intent' | 'shake' | 'offline' | 'deep';

function castLineByThreeCoins() {
  const coins = Array.from({ length: 3 }, () => (Math.random() < 0.5 ? 2 : 3));
  const sum = coins.reduce((acc, n) => acc + n, 0);
  const line = sum === 6 ? 2 : sum === 7 ? 1 : sum === 8 ? 0 : 3;
  return { coins, sum, line };
}

function renderLine(line: number, moving: boolean, index: number) {
  const isYang = line === 1 || line === 3;
  return (
    <div key={index} className="relative mb-2">
      {isYang ? (
        <div className={`h-2.5 rounded bg-zinc-100 ${moving ? 'ring-2 ring-amber-300/60' : ''}`} />
      ) : (
        <div className="flex gap-3">
          <div className={`h-2.5 flex-1 rounded bg-zinc-100 ${moving ? 'ring-2 ring-amber-300/60' : ''}`} />
          <div className={`h-2.5 flex-1 rounded bg-zinc-100 ${moving ? 'ring-2 ring-amber-300/60' : ''}`} />
        </div>
      )}
    </div>
  );
}

export default function LiuyaoFlow() {
  const [step, setStep] = useState<Step>('home');
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(categories[1]);
  const [sessionId, setSessionId] = useState('');
  const [manualLines, setManualLines] = useState<number[]>([]);
  const [cast, setCast] = useState<LiuyaoCastResult | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [recordId, setRecordId] = useState('');
  const [followup, setFollowup] = useState('');
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [lastCoins, setLastCoins] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = useMemo(() => getToken(), []);

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
      const started = await startLiuyaoSession({ question: text, category });
      setSessionId(started.sessionId);
      setManualLines([]);
      setCast(null);
      setInterpretation('');
      setRecordId('');
      setFollowupAnswer('');
      setStep('shake');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function shakeOnce() {
    if (manualLines.length >= 6) return;
    const result = castLineByThreeCoins();
    setLastCoins(result.coins);
    setManualLines((prev) => [...prev, result.line]);
  }

  async function generateHexagram() {
    if (!sessionId || manualLines.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const casted = await castLiuyao({ sessionId, lines: manualLines });
      setCast(casted.castResult);
      setStep('offline');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deepAnalyze() {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    setInterpretation('');
    setStep('deep');

    try {
      await streamReveal({
        url: `/api/liuyao/sessions/${sessionId}/reveal-stream`,
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
      <Link to="/" className="text-sm text-zinc-400 hover:text-amber-200">← 返回首页</Link>

      {step === 'home' ? (
        <section className="mt-6 rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-emerald-950/70 to-zinc-950/80 p-6 text-center">
          <h1 className="text-3xl font-serif text-emerald-100">六爻起卦</h1>
          <p className="mt-3 text-sm text-emerald-100/70">静心凝神，先起卦，再问事。</p>
          <button
            className="mt-8 w-full py-4 rounded-2xl bg-emerald-600 text-white text-lg font-semibold"
            onClick={() => setStep('intent')}
          >
            开始起卦
          </button>
        </section>
      ) : null}

      {step === 'intent' ? (
        <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 space-y-3">
          <h2 className="text-xl font-serif text-emerald-100">占卜事项</h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入你的问题（1-100字）"
            className="w-full h-24 rounded-xl bg-zinc-950 border border-zinc-700 p-3"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                className={`px-3 py-1 rounded-full text-xs border ${item === category ? 'border-emerald-300 text-emerald-200' : 'border-zinc-700 text-zinc-300'}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button disabled={loading} onClick={() => void begin()} className="w-full py-3 rounded-xl bg-emerald-600 text-white">
            {loading ? '准备中...' : '进入摇卦'}
          </button>
        </section>
      ) : null}

      {step === 'shake' ? (
        <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 text-center">
          <h2 className="text-xl font-serif text-emerald-100">摇卦（六次）</h2>
          <div className="mt-3 text-sm text-zinc-400">已摇 {manualLines.length} / 6</div>

          <div className="mt-4 rounded-xl bg-zinc-950 border border-zinc-700 p-4">
            <div className="text-xs text-zinc-500">最近一次铜钱</div>
            <div className="mt-2 flex justify-center gap-2">
              {(lastCoins.length ? lastCoins : [2, 3, 2]).map((coin, idx) => (
                <div key={idx} className="h-10 w-10 rounded-full border border-amber-300/50 flex items-center justify-center text-amber-200">
                  {coin}
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={manualLines.length >= 6}
            className="mt-4 w-full py-4 rounded-2xl bg-amber-600 text-white text-lg font-semibold"
            onClick={shakeOnce}
          >
            {manualLines.length >= 6 ? '已完成六次摇卦' : '摇一爻'}
          </button>

          <button
            disabled={manualLines.length !== 6 || loading}
            className="mt-3 w-full py-3 rounded-xl bg-emerald-600 text-white disabled:opacity-40"
            onClick={() => void generateHexagram()}
          >
            生成卦象
          </button>
        </section>
      ) : null}

      {step === 'offline' && cast ? (
        <section className="mt-6 rounded-2xl border border-emerald-300/30 bg-zinc-900/70 p-4">
          <div className="text-sm text-amber-200 mb-2">
            本卦 {cast.primary.name}（{cast.primary.fortune}） → 变卦 {cast.changed.name}（{cast.changed.fortune}）
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-zinc-400 mb-2">本卦</div>
              {[...cast.lines].reverse().map((line, idx) => renderLine(line, cast.movingLines.includes(6 - idx), idx))}
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-2">变卦</div>
              {[...cast.changed.lines].reverse().map((line, idx) => renderLine(line, false, idx))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200">
            <div className="text-zinc-400 text-xs mb-1">基础离线卦象</div>
            <div>本卦卦辞：{cast.primary.judgment}</div>
            <div className="mt-1 text-zinc-300">{cast.primary.summary}</div>
          </div>
          <button disabled={loading} className="mt-4 w-full py-3 rounded-xl bg-amber-600 text-white" onClick={() => void deepAnalyze()}>
            深度分析（调用 AI）
          </button>
        </section>
      ) : null}

      {step === 'deep' ? (
        <section className="mt-6 space-y-4">
          <InterpretationView mode="liuyao" text={interpretation || (loading ? 'AI 正在分析...' : '')} />
          {recordId ? (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
              <div className="text-sm text-zinc-300 mb-2">多轮追问</div>
              <div className="flex gap-2">
                <input
                  value={followup}
                  onChange={(e) => setFollowup(e.target.value)}
                  placeholder="继续追问"
                  className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                />
                <button onClick={() => void askFollowup()} className="px-3 py-2 rounded-lg bg-emerald-600">发送</button>
              </div>
              {followupAnswer ? <div className="mt-3 text-zinc-200 whitespace-pre-wrap">{followupAnswer}</div> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>
      ) : null}
    </main>
  );
}
