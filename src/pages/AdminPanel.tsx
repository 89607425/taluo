import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetRecords, adminGetUsers, adminLogin, adminSetUserBan } from '../services/api';
import { AdminRecordSummary, AdminUserSummary } from '../types';

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [records, setRecords] = useState<AdminRecordSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId), [users, selectedUserId]);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const resp = await adminLogin({ username, password });
      setToken(resp.token);
      const [userList, recordList] = await Promise.all([adminGetUsers(resp.token), adminGetRecords(resp.token)]);
      setUsers(userList);
      setRecords(recordList);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reload(nextToken = token, userId = selectedUserId) {
    const [userList, recordList] = await Promise.all([
      adminGetUsers(nextToken),
      adminGetRecords(nextToken, userId ? { userId } : undefined),
    ]);
    setUsers(userList);
    setRecords(recordList);
  }

  async function handleToggleBan(user: AdminUserSummary) {
    setLoading(true);
    setError('');
    try {
      await adminSetUserBan(token, { userId: user.id, banned: !user.isBanned });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter(userId: string) {
    setSelectedUserId(userId);
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await reload(token, userId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 pt-8 pb-28">
        <Link to="/" className="text-sm text-[#9fd3b7] hover:text-[#d0e6da]">← 返回首页</Link>
        <h1 className="mt-4 text-4xl cf-kaiti text-[#ecdca8]">管理员登录</h1>
        <section className="mt-6 rounded-2xl cf-panel p-4 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="管理员账号"
            className="cf-input w-full rounded-xl px-3 py-2"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="管理员密码"
            className="cf-input w-full rounded-xl px-3 py-2"
          />
          <button disabled={loading} onClick={() => void handleLogin()} className="w-full py-2 rounded-xl cf-btn">
            {loading ? '登录中...' : '进入管理后台'}
          </button>
          {error ? <div className="text-sm text-[#ffb7b7]">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 pt-8 pb-28">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-[#9fd3b7] hover:text-[#d0e6da]">← 返回首页</Link>
        <button
          className="px-3 py-1.5 text-xs rounded-lg cf-btn-ghost"
          onClick={() => {
            setToken('');
            setPassword('');
            setUsers([]);
            setRecords([]);
            setSelectedUserId('');
          }}
        >
          退出管理员
        </button>
      </div>

      <h1 className="mt-4 text-4xl cf-kaiti text-[#ecdca8]">管理后台</h1>

      <section className="mt-4 rounded-2xl cf-panel p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            className={`px-3 py-1 rounded-full text-xs ${selectedUserId ? 'cf-btn-ghost' : 'cf-btn'}`}
            onClick={() => void handleFilter('')}
          >
            全部用户记录
          </button>
          <span className="text-xs text-[#acc9ba]">
            当前筛选：{selectedUser ? `${selectedUser.nickname} (${selectedUser.email})` : '全部'}
          </span>
        </div>
      </section>

      {error ? <div className="mt-4 rounded-xl border border-[#f88888]/50 bg-[#3f1f22]/60 p-3 text-sm text-[#ffb7b7]">{error}</div> : null}

      <section className="mt-4 rounded-2xl cf-panel p-4">
        <h2 className="text-2xl cf-kaiti text-[#ecdca8]">用户管理</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#acc9ba] border-b border-[#d7b86c]/20">
                <th className="py-2 pr-3">昵称</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">占卜次数</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#d7b86c]/10">
                  <td className="py-2 pr-3">{user.nickname}</td>
                  <td className="py-2 pr-3">{user.email}</td>
                  <td className="py-2 pr-3">{user.totalCount}（六爻 {user.liuyaoCount} / 塔罗 {user.tarotCount}）</td>
                  <td className="py-2 pr-3">{user.isBanned ? '已封禁' : '正常'}</td>
                  <td className="py-2 pr-3 flex gap-2">
                    <button className="px-2 py-1 rounded-md cf-btn-ghost" onClick={() => void handleFilter(user.id)}>
                      查看记录
                    </button>
                    <button className="px-2 py-1 rounded-md cf-btn" onClick={() => void handleToggleBan(user)} disabled={loading}>
                      {user.isBanned ? '解封' : '封号'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-2xl cf-panel p-4">
        <h2 className="text-2xl cf-kaiti text-[#ecdca8]">占卜记录</h2>
        <div className="mt-4 space-y-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-xl border border-[#d7b86c]/20 bg-[#13181d] p-3">
              <div className="text-xs text-[#acc9ba]">
                {record.type === 'liuyao' ? '六爻' : '塔罗'} · {record.nickname} ({record.email}) ·{' '}
                {new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}
              </div>
              <div className="mt-1 text-[#efe7d6]">{record.question}</div>
              <div className="mt-1 text-sm text-[#c7c2b8] line-clamp-3">{record.interpretation}</div>
            </div>
          ))}
          {!records.length ? <div className="text-[#b8cfc2]/80">暂无记录</div> : null}
        </div>
      </section>
    </main>
  );
}

