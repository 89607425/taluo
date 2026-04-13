import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LiuyaoHomeStep from '../components/liuyao/LiuyaoHomeStep';
import LiuyaoIntentStep from '../components/liuyao/LiuyaoIntentStep';
import LiuyaoResultStep from '../components/liuyao/LiuyaoResultStep';
import LiuyaoShakeStep from '../components/liuyao/LiuyaoShakeStep';
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
  const [casting, setCasting] = useState(false);
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
      setCasting(false);
      setStep('shake');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function shakeOnce() {
    if (manualLines.length >= 6 || casting || loading) return;
    setCasting(true);
    const result = castLineByThreeCoins();
    setLastCoins(result.coins);
    window.setTimeout(() => {
      setManualLines((prev) => [...prev, result.line]);
      setCasting(false);
    }, 260);
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
    <main className="relative min-h-screen max-w-3xl mx-auto px-4 pt-6 pb-28 text-[#171817]">
      <div className="fixed inset-0 -z-10 bg-[#fcf9f2]" />
      <Link to="/" className="text-sm text-[#52B788] hover:text-[#40916C]">← 返回首页</Link>

      {step === 'home' ? (
        <LiuyaoHomeStep onStart={() => setStep('intent')} />
      ) : null}

      {step === 'intent' ? (
        <LiuyaoIntentStep
          question={question}
          onQuestionChange={setQuestion}
          category={category}
          categories={categories}
          onCategoryChange={setCategory}
          onBegin={() => void begin()}
          loading={loading}
        />
      ) : null}

      {step === 'shake' ? (
        <LiuyaoShakeStep
          manualLines={manualLines}
          lastCoins={lastCoins}
          casting={casting}
          loading={loading}
          onShake={shakeOnce}
          onGenerate={() => void generateHexagram()}
        />
      ) : null}

      {cast && (step === 'offline' || step === 'deep') ? (
        <LiuyaoResultStep
          cast={cast}
          loading={loading}
          interpretation={interpretation}
          recordId={recordId}
          followup={followup}
          followupAnswer={followupAnswer}
          onDeepAnalyze={() => void deepAnalyze()}
          onFollowupChange={setFollowup}
          onAskFollowup={() => void askFollowup()}
        />
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-[#b52619]/30 bg-[#fff4f2] p-3 text-sm text-[#b52619]">{error}</div>
      ) : null}
    </main>
  );
}
