const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const stats = {
    departments: db.prepare('SELECT COUNT(*) as count FROM departments').get().count,
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    agents: db.prepare('SELECT COUNT(*) as count FROM agents').get().count,
    tasks: {
      total: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count,
      in_progress: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get().count,
      completed: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count,
      urgent: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'urgent' AND status != 'completed'").get().count,
    },
    recent_tasks: db.prepare(`
      SELECT t.*, d.name as department_name, d.icon as department_icon, u.name as assignee_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.updated_at DESC LIMIT 10
    `).all(),
    agents_by_status: {
      active: db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'active'").get().count,
      paused: db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'paused'").get().count,
      offline: db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'offline'").get().count,
    }
  };

  res.json(stats);
});

module.exports = router;
