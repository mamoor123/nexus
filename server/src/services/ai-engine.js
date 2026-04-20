/**
 * Copyright (c) 2026 mamoor123
 * Licensed under the GNU Affero General Public License v3.0
 * See LICENSE for details.
 * 
 * AI Engine — now with TOON (Token-Oriented Object Notation)
 * Structured data is encoded as TOON for LLM prompts, reducing
 * token usage by ~40% while maintaining parsing accuracy.
 */

const db = require('../config/db');
const toon = require('./toon');

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt-4';

// ─── LLM Caller ──────────────────────────────────────────────────────

async function callLLM(systemPrompt, userMessage, model = DEFAULT_MODEL, options = {}) {
  const apiKey = options.apiKey || LLM_API_KEY;
  const apiUrl = options.apiUrl || LLM_API_URL;
  if (!apiKey) return simulateResponse(systemPrompt, userMessage, model);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${err}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('LLM call failed:', error.message);
    return `[Agent Error] Failed to generate response: ${error.message}`;
  }
}

function simulateResponse(systemPrompt, userMessage, model) {
  const agentRole = systemPrompt.split('\n')[0] || 'AI Agent';
  const timestamp = new Date().toISOString();
  return `🤖 **Agent Response** (simulated — no API key configured)\n\n**Task Analysis:**\nI've reviewed the task: "${userMessage.slice(0, 200)}..."\n\n**Approach:**\nBased on my role as ${agentRole.slice(0, 100)}, here's my recommended approach:\n\n1. **Research & Analysis** — Gather relevant data and context\n2. **Strategy Development** — Create actionable plan based on findings\n3. **Execution** — Implement the plan with measurable milestones\n4. **Review & Optimize** — Monitor results and iterate\n\n---\n*To enable real AI responses, set LLM_API_KEY and LLM_API_URL environment variables.*\n*Model: ${model} | Generated: ${timestamp}*`;
}

// ─── Task Execution ──────────────────────────────────────────────────

async function executeTask(taskId) {
  const task = await db.prepare(
    `SELECT t.*, a.name as agent_name, a.system_prompt, a.model, a.department_id as agent_dept_id
     FROM tasks t JOIN agents a ON t.assigned_agent_id = a.id WHERE t.id = ?`
  ).get(taskId);
  if (!task) throw new Error('Task not found');
  if (!task.assigned_agent_id) throw new Error('Task has no assigned agent');

  // Gather structured context
  const contextData = { task };

  if (task.department_id) {
    const dept = await db.prepare('SELECT * FROM departments WHERE id = ?').get(task.department_id);
    if (dept) contextData.department = dept;
  }

  const comments = await db.prepare(
    `SELECT c.*, u.name as user_name, a.name as agent_name
     FROM task_comments c
     LEFT JOIN users u ON c.user_id = u.id
     LEFT JOIN agents a ON c.agent_id = a.id
     WHERE c.task_id = ? ORDER BY c.created_at DESC LIMIT 5`
  ).all(taskId);
  if (comments.length > 0) contextData.comments = comments;

  // Build TOON prompt instead of manual string concatenation
  const contextMessage = toon.encodeForPrompt(contextData);

  console.log(`🤖 Agent "${task.agent_name}" executing task #${taskId}: ${task.title}`);
  console.log(`📊 TOON context: ~${toon.estimateTokens(contextMessage)} tokens`);

  await db.prepare(
    "UPDATE tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(taskId);

  const response = await callLLM(task.system_prompt, contextMessage, task.model);
  await db.prepare(
    'INSERT INTO task_comments (task_id, agent_id, content) VALUES (?, ?, ?)'
  ).run(taskId, task.assigned_agent_id, response);
  await db.prepare(
    "UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(taskId);

  return { taskId, agentId: task.assigned_agent_id, agentName: task.agent_name, response };
}

// ─── Agent Chat ──────────────────────────────────────────────────────

async function chatWithAgent(agentId, userMessage, channel = 'general') {
  const agent = await db.prepare(
    'SELECT a.*, d.name as department_name FROM agents a LEFT JOIN departments d ON a.department_id = d.id WHERE a.id = ?'
  ).get(agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.status !== 'active') return 'Agent is currently paused or offline.';

  const recentMessages = await db.prepare(
    'SELECT * FROM messages WHERE channel = ? ORDER BY created_at DESC LIMIT 10'
  ).all(channel);

  // Use TOON for conversation history
  const contextMessage = toon.encodeForPrompt({
    messages: recentMessages.reverse(),
    _newMessage: userMessage,
  }) + `\n\n## New Message\n${userMessage}`;

  const response = await callLLM(agent.system_prompt, contextMessage, agent.model);
  await db.prepare(
    "INSERT INTO messages (channel, sender_type, sender_id, content) VALUES (?, 'agent', ?, ?)"
  ).run(channel, agentId, response);
  return response;
}

// ─── Agent Delegation ────────────────────────────────────────────────

async function agentDelegate(fromAgentId, toAgentId, message, taskId = null) {
  const fromAgent = await db.prepare('SELECT * FROM agents WHERE id = ?').get(fromAgentId);
  const toAgent = await db.prepare('SELECT * FROM agents WHERE id = ?').get(toAgentId);
  if (!fromAgent || !toAgent) throw new Error('Agent not found');

  // TOON-encoded delegation context
  const delegationContext = toon.encodeForPrompt({
    delegation: {
      from: fromAgent.name,
      fromRole: fromAgent.role,
      message: message,
    },
  });

  const systemPrompt = `${toAgent.system_prompt}\n\nContext: You received a delegation from ${fromAgent.name} (${fromAgent.role}).`;
  const response = await callLLM(systemPrompt, delegationContext, toAgent.model);

  if (taskId) {
    await db.prepare(
      'INSERT INTO task_comments (task_id, agent_id, content) VALUES (?, ?, ?)'
    ).run(taskId, fromAgentId, `📤 Delegated to ${toAgent.name}: ${message}`);
    await db.prepare(
      'INSERT INTO task_comments (task_id, agent_id, content) VALUES (?, ?, ?)'
    ).run(taskId, toAgentId, `📥 Response from ${toAgent.name}: ${response}`);
  }

  return { from: fromAgent.name, to: toAgent.name, delegation: message, response };
}

// ─── Batch Context (for workflow evaluation) ─────────────────────────

/**
 * Build a TOON context from multiple tasks for batch LLM evaluation.
 * Useful when the execution loop or workflow engine needs to send
 * several tasks to an agent at once.
 */
async function buildBatchContext(taskIds) {
  const tasks = [];
  for (const id of taskIds) {
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (task) tasks.push(task);
  }
  return toon.encodeForPrompt({ tasks });
}

// ─── Stats ───────────────────────────────────────────────────────────

/**
 * Compare JSON vs TOON token usage for a given context.
 * Call this in dev to measure savings.
 */
function compareFormats(contextData) {
  const asJson = JSON.stringify(contextData, null, 2);
  const asToon = toon.encodeForPrompt(contextData);
  return toon.tokenStats(asJson, asToon);
}

module.exports = {
  callLLM,
  executeTask,
  chatWithAgent,
  agentDelegate,
  buildBatchContext,
  compareFormats,
};
