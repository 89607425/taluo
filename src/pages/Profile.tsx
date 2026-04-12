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
        <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回首页</Link>
        <h1 className="mt-4 text-3xl font-serif text-emerald-900">登录 / 注册</h1>

        <section className="mt-6 rounded-2xl spring-panel p-4 space-y-3">
          <div className="flex rounded-xl border border-emerald-200 p-1">
            <button className={`flex-1 py-2 text-sm rounded-lg ${mode === 'login' ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-600'}`} onClick={() => setMode('login')}>登录</button>
            <button className={`flex-1 py-2 text-sm rounded-lg ${mode === 'register' ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-600'}`} onClick={() => setMode('register')}>注册</button>
          </div>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full rounded-xl bg-white border border-emerald-200 px-3 py-2"
          />
          {mode === 'register' ? (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="昵称"
              className="w-full rounded-xl bg-white border border-emerald-200 px-3 py-2"
            />
          ) : null}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="密码（至少6位）"
            className="w-full rounded-xl bg-white border border-emerald-200 px-3 py-2"
          />
          <button disabled={loading} onClick={() => void submit()} className="w-full py-2 rounded-xl spring-btn text-white">
            {loading ? '提交中...' : mode === 'register' ? '注册并登录' : '登录'}
          </button>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-8 pb-28">
      <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">← 返回首页</Link>
      <h1 className="mt-4 text-3xl font-serif text-emerald-900">个人中心</h1>

      <section className="mt-6 rounded-2xl spring-panel p-4">
        <div className="text-sm text-emerald-900">{user.nickname}</div>
        <div className="text-xs text-emerald-600 mt-1">{user.email}</div>
        <button
          className="mt-3 px-3 py-1.5 text-xs rounded-lg spring-btn-ghost"
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
        >
          退出登录
        </button>
      </section>

      <section className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl spring-panel p-4">
          <div className="text-xs text-emerald-600">六爻次数</div>
          <div className="mt-2 text-2xl text-emerald-700">{stats?.liuyaoCount ?? '-'}</div>
        </div>
        <div className="rounded-xl spring-panel p-4">
          <div className="text-xs text-emerald-600">塔罗次数</div>
          <div className="mt-2 text-2xl text-emerald-700">{stats?.tarotCount ?? '-'}</div>
        </div>
        <div className="rounded-xl spring-panel p-4">
          <div className="text-xs text-emerald-600">总次数</div>
          <div className="mt-2 text-2xl text-emerald-700">{stats?.totalCount ?? '-'}</div>
        </div>
      </section>

      {error ? <div className="mt-4 text-red-600">{error}</div> : null}
    </main>
  );
}
