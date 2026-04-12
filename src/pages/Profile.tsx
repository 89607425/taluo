import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearToken, fetchProfile, login, me, register, setToken } from '../services/api';
import { ProfileStats, User } from '../types';

export default function Profile() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAuthed() {
    const [meResp, profile] = await Promise.all([me(), fetchProfile()]);
    setUser(meResp.user);
    setStats(profile);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadAuthed();
      } catch {
        setUser(null);
      }
    })();
  }, []);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        const resp = await register({ email, password, nickname: nickname || '新用户' });
        setToken(resp.token);
      } else {
        const resp = await login({ email, password });
        setToken(resp.token);
      }
      setPassword('');
      await loadAuthed();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-28">
        <Link to="/" className="text-sm text-zinc-400 hover:text-amber-200">← 返回首页</Link>
        <h1 className="mt-4 text-3xl font-serif text-amber-100">登录 / 注册</h1>

        <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 space-y-3">
          <div className="flex rounded-xl border border-zinc-700 p-1">
            <button className={`flex-1 py-2 text-sm rounded-lg ${mode === 'login' ? 'bg-zinc-700' : ''}`} onClick={() => setMode('login')}>登录</button>
            <button className={`flex-1 py-2 text-sm rounded-lg ${mode === 'register' ? 'bg-zinc-700' : ''}`} onClick={() => setMode('register')}>注册</button>
          </div>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
          {mode === 'register' ? (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="昵称"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
            />
          ) : null}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="密码（至少6位）"
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
          <button disabled={loading} onClick={() => void submit()} className="w-full py-2 rounded-xl bg-amber-600 text-white">
            {loading ? '提交中...' : mode === 'register' ? '注册并登录' : '登录'}
          </button>
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-8 pb-28">
      <Link to="/" className="text-sm text-zinc-400 hover:text-amber-200">← 返回首页</Link>
      <h1 className="mt-4 text-3xl font-serif text-amber-100">个人中心</h1>

      <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
        <div className="text-sm text-zinc-200">{user.nickname}</div>
        <div className="text-xs text-zinc-400 mt-1">{user.email}</div>
        <button
          className="mt-3 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-700"
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
        >
          退出登录
        </button>
      </section>

      <section className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
          <div className="text-xs text-zinc-400">六爻次数</div>
          <div className="mt-2 text-2xl text-emerald-200">{stats?.liuyaoCount ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
          <div className="text-xs text-zinc-400">塔罗次数</div>
          <div className="mt-2 text-2xl text-violet-200">{stats?.tarotCount ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
          <div className="text-xs text-zinc-400">总次数</div>
          <div className="mt-2 text-2xl text-amber-200">{stats?.totalCount ?? '-'}</div>
        </div>
      </section>

      {error ? <div className="mt-4 text-red-300">{error}</div> : null}
    </main>
  );
}
