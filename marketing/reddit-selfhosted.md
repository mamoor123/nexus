# Reddit Post (r/selfhosted)

**Title:** I was paying $600/mo for 5 SaaS tools. Built a self-hosted alternative with AI agents — open-sourced it.

**Body:**

Hey r/selfhosted,

I was running a small team and paying for Trello + Notion + Zapier + Gmail + an AI chatbot tool. $600/month for 5 different services that barely talked to each other.

So I built [HiveOps](https://github.com/mamoor123/hiveops) — a self-hosted company operating system that does all of it in one container.

**What it includes:**
- Task management (priority levels, assign to users or AI agents)
- AI agents that actually execute tasks (not just chat) — with retry logic and dead letter queues
- Workflow automation (trigger → conditions → actions, like a mini Zapier)
- Real email (SMTP + IMAP integration, AI drafts replies)
- Knowledge base with full-text search
- Real-time notifications via Socket.IO
- JWT auth with role-based access

**Tech:**
- Node.js + Express backend
- Next.js 14 frontend
- SQLite for dev, PostgreSQL for production
- 58 tests passing
- One `docker-compose up` to run everything

**Quick start:**
```bash
git clone https://github.com/mamoor123/hiveops.git && cd hiveops
cp .env.example .env
# Set JWT_SECRET in .env
docker-compose up --build
```

Open http://localhost:3000 and you're good.

Would love feedback from this community. What would you add? What's missing?

GitHub: https://github.com/mamoor123/hiveops
