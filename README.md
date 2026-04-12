# 玄机（心易 × 塔罗）统一占卜平台

基于 `xinyi` + `taluo` 合并实现，手机端优先。

- 前端：React + TypeScript + Vite + React Router
- 后端：Express + TypeScript + MySQL + Redis(可降级内存 Session)
- AI：SiliconFlow/OpenAI（任一可配，不配则离线兜底）

## 当前实现

- 登录注册（邮箱+密码）+ JWT 鉴权
- 用户维度历史记录与个人统计
- 六爻完整流程（起卦首页 -> 事项输入 -> 手动摇六次 -> 离线卦象 -> 深度 AI 分析）
- 塔罗完整流程（问题+模式选择 -> 牌堆抽牌 -> AI 分析）
- 塔罗逆位设置（用户级开关）
- 统一历史记录（六爻/塔罗混合、筛选、搜索、详情、删除）
- Provider 架构（`LiuyaoProvider` / `TarotProvider`）

## 启动

```bash
npm install
npm run db:init
npm run dev:server
npm run dev -- --port 3001
```

推荐访问：`http://localhost:3001`

## 环境变量

见 `.env.example`，关键项：

- `DATABASE_URL` 或 `DB_*`
- `REDIS_URL`
- `SILICONFLOW_API_KEY` / `OPENAI_API_KEY`
- `JWT_SECRET`
