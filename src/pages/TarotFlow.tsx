import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TarotDrawStep from '../components/tarot/TarotDrawStep';
import TarotResultStep from '../components/tarot/TarotResultStep';
import TarotSetupStep from '../components/tarot/TarotSetupStep';
import { TAROT_CARD_MAP } from '../constants';
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
  const [deckCount, setDeckCount] = useState(78);
  const [shuffled, setShuffled] = useState(false);
  const [lastDraw, setLastDraw] = useState<{
    cardId: string;
    cardName: string;
    position: string;
    isReversed: boolean;
  } | null>(null);
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
      setSessionId(started.sessionId);
      setSelected([]);
      setDeckCount(78);
      setShuffled(false);
      setLastDraw(null);
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

  async function shuffleDeck() {
    if (!sessionId || loading) return;
    setLoading(true);
    setError('');
    try {
      await shuffleTarotSession({ sessionId });
      setShuffled(true);
      setDeckCount(78);
      setSelected([]);
      setLastDraw(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function pick() {
    if (!sessionId || !shuffled || selected.length >= requiredCount || loading) return;
    setLoading(true);
    setError('');
    try {
      const randomDeckIndex = Math.max(0, Math.floor(Math.random() * deckCount));
      const resp = await selectTarotCard({ sessionId, deckIndex: randomDeckIndex });
      const picked = { cardId: resp.cardId, position: resp.position, isReversed: resp.isReversed };
      setSelected((prev) => [...prev, picked]);
      setDeckCount((prev) => Math.max(0, prev - 1));
      setLastDraw({
        cardId: resp.cardId,
        cardName: TAROT_CARD_MAP.get(resp.cardId)?.name || resp.cardId,
        position: resp.position,
        isReversed: resp.isReversed,
      });
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
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-6 pb-28">
      <Link to="/" className="text-sm text-[#9fd3b7] hover:text-[#d0e6da]">← 返回首页</Link>
      <h1 className="mt-4 text-4xl cf-kaiti text-[#ecdca8]">塔罗占卜</h1>

      {step === 'setup' ? (
        <TarotSetupStep
          question={question}
          onQuestionChange={setQuestion}
          spreads={spreads}
          spread={spread}
          onSpreadChange={setSpread}
          reverseEnabled={reverseEnabled}
          onToggleReverse={() => setReverseEnabled((v) => !v)}
          loading={loading}
          onBegin={() => void begin()}
        />
      ) : null}

      {step === 'draw' ? (
        <TarotDrawStep
          selected={selected}
          requiredCount={requiredCount}
          loading={loading}
          deckCount={deckCount}
          shuffled={shuffled}
          lastDraw={lastDraw}
          onShuffle={() => void shuffleDeck()}
          onPick={() => void pick()}
          onAnalyze={() => void analyze()}
        />
      ) : null}

      {step === 'result' ? (
        <TarotResultStep
          interpretation={interpretation}
          loading={loading}
          recordId={recordId}
          selected={selected}
          followup={followup}
          followupAnswer={followupAnswer}
          onFollowupChange={setFollowup}
          onAskFollowup={() => void askFollowup()}
        />
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-[#f88888]/50 bg-[#3f1f22]/60 p-3 text-sm text-[#ffb7b7]">{error}</div>
      ) : null}
    </main>
  );
}
