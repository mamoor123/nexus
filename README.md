# 🏢 Company OS

AI-Powered Company Operating System — automate and manage entire business operations through intelligent AI agents.

A fully-featured web application with real-time notifications, task management, AI agent execution, knowledge base, email, workflow automation, analytics, file uploads, and an admin system panel.

## Architecture

```
company-os/
├── server/                          # Express API + Socket.IO + SQLite
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # SQLite schema (12 tables)
│   │   │   └── migrations/          # DB migrations
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT auth + role-based access
│   │   │   ├── rateLimit.js         # Auth endpoint rate limiting
│   │   │   └── validate.js          # Input validation & sanitization
│   │   ├── routes/
│   │   │   ├── auth.js              # Register, login, profile, password, roles
│   │   │   ├── departments.js       # Department CRUD
│   │   │   ├── tasks.js             # Tasks + comments + notifications
│   │   │   ├── agents.js            # AI agent management
│   │   │   ├── dashboard.js         # Stats + activity data
│   │   │   ├── ai.js                # AI chat + execution + delegation
│   │   │   ├── knowledge.js         # Knowledge base CRUD + search
│   │   │   ├── email.js             # Email read/send/AI draft
│   │   │   ├── workflows.js         # Workflow CRUD + triggers
│   │   │   ├── notifications.js     # Notification API
│   │   │   ├── uploads.js           # File upload/download
│   │   │   └── system.js            # Admin: LLM config, execution loop, scheduler
│   │   ├── services/
│   │   │   ├── ai-engine.js         # LLM integration (OpenAI-compatible)
│   │   │   ├── email.js             # Email service (SQLite-backed)
│   │   │   ├── workflows.js         # Workflow engine (SQLite-backed)
│   │   │   ├── notifications.js     # Notification broadcast via Socket.IO
│   │   │   ├── execution-loop.js    # Auto task execution background service
│   │   │   └── scheduler.js         # Cron-like scheduled task runner
│   │   └── index.js                 # Entry point + Socket.IO setup
│   ├── Dockerfile
│   └── package.json
├── web/                             # Next.js 14 frontend
│   ├── app/
│   │   ├── layout.js                # Sidebar + Socket.IO + ToastProvider
│   │   ├── page.js                  # Redirect logic
│   │   ├── login/                   # Auth page
│   │   ├── dashboard/               # Stats + quick actions + activity
│   │   ├── departments/             # Department cards + detail expansion
│   │   ├── tasks/                   # Task list + filters + detail modal
│   │   ├── agents/                  # Agent cards + edit modal
│   │   ├── chat/                    # Real-time chat + agent chat
│   │   ├── knowledge/               # Articles + search + filters
│   │   ├── email/                   # Email client + AI replies
│   │   ├── workflows/               # Workflow editor + execution log
│   │   ├── analytics/               # Charts + real data
│   │   └── settings/                # Profile, security, team, system, scheduler
│   ├── components/
│   │   ├── Toast.js                 # Toast notification system
│   │   ├── NotificationBell.js      # Real-time notification dropdown
│   │   ├── CommandPalette.js        # ⌘K global search
│   │   ├── TaskDetailModal.js       # Task detail + comments + attachments
│   │   └── AgentEditModal.js        # Agent configuration modal
│   ├── lib/
│   │   ├── api.js                   # API client (50+ endpoints)
│   │   └── auth.js                  # Auth context + token management
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — JWT_SECRET is required
# Generate one: openssl rand -base64 32
```

### 2. Development (without Docker)

```bash
# Install dependencies
cd server && npm install && cd ..
cd web && npm install && cd ..

# Run server (terminal 1)
cd server && JWT_SECRET=your-secret npm run dev

# Run web (terminal 2)
cd web && npm run dev
```

### 3. Production (Docker)

```bash
JWT_SECRET=your-secret docker-compose up --build
```

### Access
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

## Features

### 🔐 Security
- JWT authentication with required secret (no default fallback)
- bcrypt password hashing (10 rounds)
- Role-based access control (admin, manager, member)
- Auth rate limiting (20 attempts per 15 minutes)
- Configurable CORS origin
- Input validation and sanitization middleware
- Dangerous file type blocking on uploads
- Global error handler

### 🏢 Departments
- CRUD with name, description, icon, color
- Expandable detail view: members, agents, tasks
- Member count, agent count, active task stats
- Admin-only creation and deletion

### 📋 Tasks
- Full CRUD with priority (urgent/high/medium/low) and status (pending/in_progress/review/completed/blocked)
- Assign to users or AI agents
- Due dates with overdue detection
- Task detail modal with:
  - Inline status changes
  - Comment/activity feed
  - File attachments (upload, download, delete)
- Notifications on assignment, completion, and comments
- Click-to-open detail modal

### 🤖 AI Agents
- Per-department agent configuration
- System prompt editor with character count
- Model selection (GPT-4, Claude, Llama, Mistral, etc.)
- Status management (active/paused/offline)
- Agent edit modal
- Task execution with context (task details, comments, department)
- Agent-to-agent delegation
- Graceful fallback to simulated responses when no API key

### ⚡ Auto-Execution Loop
- Background service checks every 30 seconds
- Auto-executes tasks assigned to active agents
- Priority-ordered (urgent first)
- Max 3 concurrent executions
- Auto-notifies on completion or failure
- Failed tasks marked as blocked
- Admin start/stop toggle + manual run trigger

### ⏰ Cron Scheduler
- Three schedule types: daily, weekly, interval
- Per-schedule agent assignment and priority
- Auto-calculates next run time
- Full CRUD via admin Settings panel

### 💬 Real-Time Chat
- Socket.IO-powered with typing indicators
- Channel-based (general, custom channels)
- Direct agent chat with AI responses
- Message history persistence
- Agent selection sidebar

### 📚 Knowledge Base
- Article CRUD with rich content
- Department and category filtering
- Full-text search
- Tags system
- Category colors (general, guide, policy, training, reference, process)

### 📧 Email
- Inbox, Sent, Drafts, Starred folders
- Compose and reply
- AI-generated draft replies
- Search across emails
- Label system
- Star toggle

### ⚡ Workflow Engine
- Trigger-based automation (task_created, task_completed, schedule_daily, user_registered, etc.)
- Configurable conditions (equals, contains, greater_than, past_due, exists)
- Action types: notify, update_task, send_message, create_task
- Enable/disable toggle
- Execution log with history
- SQLite-persisted (not in-memory)

### 📈 Analytics
- Donut charts (completion rate, agent status, urgent tasks)
- Bar charts (tasks by status, tasks by priority)
- Real weekly activity data (from API)
- Department breakdown

### 🔔 Notifications
- Real-time push via Socket.IO
- Types: task_assigned, task_completed, task_comment, agent_response, workflow_triggered, system
- Bell icon with unread badge
- Dropdown with mark-all-read
- Auto-join user room on connection

### 🔍 Command Palette
- Ctrl/⌘+K global search
- Search across tasks, articles, agents
- Quick navigation shortcuts
- Keyboard navigation (↑↓ Enter ESC)

### 📎 File Uploads
- Multer-based with 10MB limit
- Per-user directories with random filenames
- Task attachments (upload, download, delete)
- Dangerous file type blocking
- Token-based download links

### ⚙️ Settings (Admin System Panel)
- **Profile:** Update name, department
- **Security:** Change password with verification
- **Team:** Manage user roles (admin only)
- **System:** LLM config status, test connection, server metrics
- **Scheduler:** Cron task management
- **About:** Version and tech stack info

### 📊 Dashboard
- Stats cards (departments, users, agents, active tasks, urgent)
- Quick actions bar
- Recent tasks with status badges
- Agent status breakdown
- Recent notifications widget
- Current date display

## Database Schema (12 Tables)

| Table | Description |
|-------|-------------|
| `users` | Authentication, roles, profiles |
| `departments` | Organizational units |
| `agents` | AI agent configurations |
| `tasks` | Task management with assignments |
| `task_comments` | Task activity and agent responses |
| `messages` | Chat message history |
| `knowledge_base` | Articles and documentation |
| `workflows` | Automation rules (SQLite) |
| `workflow_logs` | Execution history |
| `emails` | Email storage (SQLite) |
| `notifications` | User notifications |
| `uploads` | File attachment metadata |

## API Endpoints (50+)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (rate-limited) |
| POST | `/api/auth/login` | Login (rate-limited) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth` | List users |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| PUT | `/api/auth/:id/role` | Update user role (admin) |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List with counts |
| POST | `/api/departments` | Create (admin) |
| GET | `/api/departments/:id` | Detail with members/agents/tasks |
| PUT | `/api/departments/:id` | Update (admin) |
| DELETE | `/api/departments/:id` | Delete (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List with filters |
| POST | `/api/tasks` | Create (+ notify assignee) |
| GET | `/api/tasks/:id` | Single task detail |
| PUT | `/api/tasks/:id` | Update (+ notify on status change) |
| DELETE | `/api/tasks/:id` | Delete |
| POST | `/api/tasks/:id/comments` | Add comment (+ notify) |
| GET | `/api/tasks/:id/comments` | Get comments |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List with department info |
| POST | `/api/agents` | Create (admin) |
| PUT | `/api/agents/:id` | Update (admin) |
| DELETE | `/api/agents/:id` | Delete (admin) |

### AI Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/execute/:taskId` | Execute task with agent |
| POST | `/api/ai/chat/:agentId` | Chat with agent |
| POST | `/api/ai/delegate` | Agent-to-agent delegation |
| GET | `/api/ai/messages/:channel` | Chat history |
| GET | `/api/ai/channels` | List channels |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge` | List with filters |
| POST | `/api/knowledge` | Create article |
| GET | `/api/knowledge/:id` | Single article |
| PUT | `/api/knowledge/:id` | Update article |
| DELETE | `/api/knowledge/:id` | Delete article |
| POST | `/api/knowledge/search` | Search articles |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/email/:folder` | List by folder |
| GET | `/api/email/item/:id` | Single email |
| POST | `/api/email/send` | Send email |
| POST | `/api/email/draft` | Save draft |
| POST | `/api/email/:id/star` | Toggle star |
| POST | `/api/email/:id/move` | Move to folder |
| POST | `/api/email/:id/draft-reply` | AI draft reply |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create (admin) |
| PUT | `/api/workflows/:id` | Update (admin) |
| DELETE | `/api/workflows/:id` | Delete (admin) |
| POST | `/api/workflows/:id/toggle` | Enable/disable (admin) |
| POST | `/api/workflows/trigger/:trigger` | Manual trigger |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Unread count |
| POST | `/api/notifications/:id/read` | Mark read |
| POST | `/api/notifications/read-all` | Mark all read |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads` | Upload file |
| GET | `/api/uploads/task/:taskId` | List task files |
| GET | `/api/uploads/:id/download` | Download file |
| DELETE | `/api/uploads/:id` | Delete file |

### System (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/status` | Server + LLM + loop status |
| POST | `/api/system/test-llm` | Test LLM connection |
| POST | `/api/system/execution-loop/toggle` | Start/stop auto-execution |
| POST | `/api/system/execution-loop/run` | Manual execution cycle |
| GET | `/api/system/schedules` | List schedules |
| POST | `/api/system/schedules` | Create schedule |
| PUT | `/api/system/schedules/:id` | Update schedule |
| DELETE | `/api/system/schedules/:id` | Delete schedule |
| POST | `/api/system/schedules/:id/toggle` | Toggle schedule |

## Environment Variables

```bash
# Required
JWT_SECRET=your-secret-here          # Generate: openssl rand -base64 32

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DB_PATH=./data/company-os.db

# LLM (optional — simulated responses when not set)
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-...
DEFAULT_MODEL=gpt-4

# Frontend (web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, SQLite (better-sqlite3) |
| Frontend | Next.js 14 (App Router), React 18 |
| Styling | Tailwind CSS, CSS custom properties |
| Real-time | Socket.IO (chat, notifications, typing) |
| Auth | JWT + bcrypt |
| Database | SQLite with WAL mode |
| AI Engine | OpenAI-compatible API (pluggable) |
| File Upload | Multer |
| Deployment | Docker, docker-compose |
| Security | Helmet, CORS, rate limiting, input validation |

## License

MIT
