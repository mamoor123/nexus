# 🏢 Company OS

AI-Powered Company Operating System — automate and manage entire business operations through intelligent AI agents.

## Architecture

```
company-os/
├── server/          # Express API + Socket.IO + SQLite
│   ├── src/
│   │   ├── config/      # Database setup
│   │   ├── middleware/   # Auth (JWT)
│   │   ├── routes/      # API endpoints
│   │   └── index.js     # Entry point
│   └── Dockerfile
├── web/             # Next.js frontend
│   ├── app/         # App Router pages
│   ├── lib/         # API client, auth context
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Development (without Docker)
```bash
# Install dependencies
cd server && npm install && cd ..
cd web && npm install && cd ..

# Run server (terminal 1)
cd server && npm run dev

# Run web (terminal 2)  
cd web && npm run dev
```

### Production (Docker)
```bash
docker-compose up --build
```

### Access
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001

## Features

### Phase 1 ✅ (Current)
- [x] User authentication (register, login, roles)
- [x] Department management
- [x] Task management with priorities & statuses
- [x] AI Agent configuration
- [x] Dashboard with stats
- [x] Real-time chat infrastructure (Socket.IO)
- [x] Dark UI with sidebar navigation

### Phase 2 (Next)
- [ ] OpenClaw AI engine integration
- [ ] Agent-to-agent communication
- [ ] Chat interface
- [ ] Task execution by AI agents
- [ ] Knowledge base

### Phase 3 (Future)
- [ ] Email integration
- [ ] Workflow automation & triggers
- [ ] Analytics dashboard
- [ ] File management

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/agents` | List agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/dashboard` | Dashboard stats |

## Tech Stack
- **Backend:** Node.js, Express, SQLite, Socket.IO
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Auth:** JWT + bcrypt
- **Deploy:** Docker, docker-compose
