const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { executeTask, chatWithAgent, agentDelegate } = require('../services/ai-engine');

const router = express.Router();

// Execute a task with its assigned agent
router.post('/execute/:taskId', authMiddleware, async (req, res) => {
  try {
    const result = await executeTask(parseInt(req.params.taskId));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Chat with an agent
router.post('/chat/:agentId', authMiddleware, async (req, res) => {
  try {
    const { message, channel } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Store user message
    const msgChannel = channel || 'general';
    const userMsg = db.prepare(
      "INSERT INTO messages (channel, sender_type, sender_id, content) VALUES (?, 'user', ?, ?)"
    ).run(msgChannel, req.user.id, message);

    // Get agent response
    const response = await chatWithAgent(parseInt(req.params.agentId), message, msgChannel);

    res.json({
      userMessage: {
        id: userMsg.lastInsertRowid,
        channel: msgChannel,
        sender_type: 'user',
        sender_id: req.user.id,
        sender_name: req.user.name,
        content: message,
      },
      agentResponse: response,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Agent delegation
router.post('/delegate', authMiddleware, async (req, res) => {
  try {
    const { fromAgentId, toAgentId, message, taskId } = req.body;
    if (!fromAgentId || !toAgentId || !message) {
      return res.status(400).json({ error: 'fromAgentId, toAgentId, and message are required' });
    }
    const result = await agentDelegate(fromAgentId, toAgentId, message, taskId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get chat messages for a channel
router.get('/messages/:channel', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const messages = db.prepare(`
    SELECT m.*,
      CASE WHEN m.sender_type = 'user' THEN u.name ELSE a.name END as sender_name
    FROM messages m
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
    WHERE m.channel = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(req.params.channel, limit);

  res.json(messages.reverse());
});

// Get available channels
router.get('/channels', authMiddleware, (req, res) => {
  const channels = db.prepare(`
    SELECT DISTINCT channel, COUNT(*) as message_count,
      MAX(created_at) as last_activity
    FROM messages
    GROUP BY channel
    ORDER BY last_activity DESC
  `).all();

  // Always include general channel
  if (!channels.find(c => c.channel === 'general')) {
    channels.unshift({ channel: 'general', message_count: 0, last_activity: null });
  }

  res.json(channels);
});

module.exports = router;
