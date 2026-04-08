---
title: "I was paying $600/mo for 5 SaaS tools. So I built one that does all of them — and open-sourced it."
published: false
description: "A self-hosted company OS with AI agents that actually execute tasks. Tasks, email, workflows, knowledge base — one Docker container you own."
tags: opensource, showdev, node, nextjs, selfhosted
cover_image: # Add a screenshot of the HiveOps dashboard here
---

# I was paying $600/mo for 5 SaaS tools. So I built one that does all of them — and open-sourced it.

Last year I was running a 12-person team and paying for:

- **Trello** — task management ($12/user/mo)
- **Notion** — knowledge base ($10/user/mo)
- **Zapier** — workflow automation ($30/mo)
- **Gmail** — email (free, but 5 tabs of context switching)
- **Some chatbot tool** — AI assistant ($50/mo)

**Total: ~$600/month.** Five tools. Five bills. Five places where information went to die.

I kept thinking: *why can't one thing do all of this?*

So I built [HiveOps](https://github.com/mamoor123/hiveops) — a self-hosted company operating system with AI agents that actually execute tasks, not just chat.

And I open-sourced it.

---

## What HiveOps Actually Does

It's a full-stack Node.js app that gives your team:

**Task Management** — priority levels, status tracking, assign to users or AI agents, comments, file attachments.

**AI Agents** — not chatbots. Real agents that execute tasks with retry logic, exponential backoff, and a dead letter queue. Assign a task to an agent and it runs it.

**Workflow Automation** — event-driven rules. Trigger → Conditions → Actions. Example: *"When an urgent task is created, notify the department manager and auto-assign it to an agent."*

**Real Email** — inbox, sent, drafts, starred. IMAP polling for inbound. SMTP for outbound. AI drafts replies. Not a mock — real email.

**Real-Time Chat** — Socket.IO with typing indicators, channels, direct agent chat.

**Knowledge Base** — full-text search, categories, CRUD.

**Scheduler** — DB-persisted cron. Interval, daily, weekly. Auto-creates tasks and triggers agents.

---

## The Tech Stack

```
Backend:    Node.js + Express
Frontend:   Next.js 14 (App Router) + Tailwind
Database:   SQLite (dev) or PostgreSQL (production)
Real-time:  Socket.IO
Auth:       JWT + bcrypt
AI:         Any OpenAI-compatible API
Email:      Nodemailer + ImapFlow
Deploy:     docker-compose up
```

The database adapter is the part I'm most proud of. Same API, two backends:

```javascript
// This works on SQLite AND PostgreSQL — zero changes needed
const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const tasks = await db.prepare('SELECT * FROM tasks WHERE status = ?').all('pending');
await db.prepare('INSERT INTO users (...) VALUES (...)').run(...);
```

SQLite for local dev (no Docker needed). PostgreSQL for production (one env var). Auto-converts `?` placeholders to `$1, $2`. Auto-handles boolean differences. Auto-coerces bigint strings from COUNT queries.

---

## The AI Agent System (This Is The Interesting Part)

Most "AI agent" projects are chatbots with extra steps. HiveOps agents are different:

```javascript
// Agent auto-execution loop:
// 1. Pick pending tasks assigned to active agents
// 2. Execute via LLM with the agent's system prompt
// 3. On failure -> retry with exponential backoff (10s, 20s, 40s)
// 4. After 3 retries -> dead letter queue + notify task creator
```

Agents can also **delegate to each other**:

```javascript
// Agent A (marketing) delegates to Agent B (engineering)
await agentDelegate(marketingAgentId, engineeringAgentId,
  "We need a landing page for the Q2 campaign", taskId);
```

And the **workflow engine** ties it all together:

```javascript
// When a task is created with priority "urgent":
// -> Check: is priority === "urgent"?
// -> Action 1: notify the department manager
// -> Action 2: auto-assign to the ops agent
// -> Action 3: send a message to the #urgent channel
```

No Zapier. No monthly fee. Just rules that run.

---

## How to Run It

```bash
git clone https://github.com/mamoor123/hiveops.git && cd hiveops
cp .env.example .env
openssl rand -base64 32  # paste into JWT_SECRET
docker-compose up --build
```

Open http://localhost:3000. That's it.

Or if you don't want Docker — SQLite mode works out of the box:

```bash
cd server && npm install && npm run migrate
JWT_SECRET=your-secret npm run dev
```

---

## What I Learned Building This

**1. Dual-database adapters are worth the effort.** Supporting SQLite + PostgreSQL from day one means devs can contribute without Docker, and you deploy with Postgres for real workloads. The adapter is ~250 lines and handles all the quirks (bigint strings, boolean differences, placeholder syntax).

**2. AI agents need execution infrastructure, not just prompts.** The prompt is 10% of the work. The retry logic, error handling, dead letter queues, concurrency control — that's the other 90%.

**3. Real-time is a superpower for internal tools.** Socket.IO notifications feel *alive* compared to polling. Users notice the difference.

**4. Open source is a force multiplier.** I built this for myself, but open-sourcing it means I get bug reports, feature requests, and contributors for free.

---

## What's Next

- Mobile-friendly responsive UI
- Calendar view for tasks
- Webhook integrations
- Multi-tenant support
- SSO (SAML/OIDC)

---

## Try It

**GitHub:** [github.com/mamoor123/hiveops](https://github.com/mamoor123/hiveops)

Star it if you find it useful. Open an issue if you find a bug. PRs welcome.

If you're paying for 5+ tools and your team is under 50 people — give it a spin. You might save $600/month like I did.

---

*What tools are you paying for that you wish were one thing? I'd love to hear in the comments.*
