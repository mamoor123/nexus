# Twitter/X Launch Thread

## Tweet 1 (Hook)
I was paying $600/mo for 5 SaaS tools.

Trello. Notion. Zapier. Gmail. A chatbot.

So I built one thing that does all of them — and open-sourced it.

It's called HiveOps. Here's what it does 🧵

## Tweet 2 (What it is)
HiveOps is a self-hosted company OS:

- Task management with AI agent execution
- Workflow automation (no Zapier)
- Real email (SMTP + IMAP)
- Knowledge base
- Real-time chat
- One `docker-compose up`

## Tweet 3 (The AI part)
The AI agents aren't chatbots.

They execute tasks with retry logic, exponential backoff, and dead letter queues.

Assign a task → agent runs it → fails? retry 3x → still fails? notify you.

Agents can also delegate to each other.

## Tweet 4 (Workflow engine)
The workflow engine is built-in:

Trigger: task created
Condition: priority === "urgent"
Action 1: notify manager
Action 2: auto-assign to agent
Action 3: post in #urgent channel

No monthly fee. Rules that just run.

## Tweet 5 (Tech)
Tech stack:
- Node.js + Express
- Next.js 14 + Tailwind
- SQLite (dev) or PostgreSQL (prod)
- Socket.IO for real-time
- JWT auth
- 58 tests passing

## Tweet 6 (CTA)
One command to run:

```
docker-compose up --build
```

GitHub: github.com/mamoor123/hiveops

Star it if you find it useful. PRs welcome.

Stop renting your tools. Start owning them. 🐝
