# 春风 · 塔罗（全栈 MVP）

前端：`Vite + React`  
后端：`Express + MySQL + Redis`  
AI：`SiliconFlow（DeepSeek）+ 可选 OpenAI fallback`

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制 `.env.example` 为 `.env.local`（前端）和 `.env`（后端）或统一放到 shell 环境中。

关键变量：

- `DATABASE_URL`
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`（不使用 URL 时）
- `REDIS_URL`
- `SILICONFLOW_API_KEY`
- `SILICONFLOW_MODEL`
- `VITE_API_PROXY_TARGET`（本地默认 `http://localhost:8787`）

## 3. 初始化数据库

```bash
npm run db:init
```

## 4. 本地启动

终端 1（后端）：

```bash
npm run dev:server
```

终端 2（前端）：

```bash
npm run dev
```

## 5. PRD 对齐已实现项（本次）

- 10-200 字意图校验 + 敏感词拦截
- Redis 会话草稿（24h TTL，接口续期 2h）
- 草稿上限 5 条，超出淘汰最早草稿
- Fisher-Yates 洗牌 + 逆位规则（默认开，设置可关）
- 选牌 300ms 防抖 + 单牌阵排重
- 流式 AI 解读（SSE）+ 15s 超时降级
- 历史记录写库并限制 30 条
- 设置持久化到 MySQL
- 灵感笔记与记录绑定并落库
- “保存为图片”本地导出（v1.0）
