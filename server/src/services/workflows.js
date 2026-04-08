/**
 * Workflow Engine
 * 
 * Automates task assignment, escalation, and notifications
 * based on configurable triggers and rules.
 */

const db = require('../config/db');

// Workflow rules storage
let workflows = [];
let workflowIdCounter = 1;
let executionLog = [];

/**
 * Seed default workflows
 */
function seedWorkflows() {
  if (workflows.length > 0) return;

  workflows = [
    {
      id: workflowIdCounter++,
      name: 'Auto-assign urgent tasks to department manager',
      description: 'When a task is created with urgent priority, assign to the department manager',
      trigger: 'task_created',
      conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
      actions: [{ type: 'notify', target: 'department_manager', message: 'Urgent task created: {{task.title}}' }],
      enabled: true,
      runs: 3,
      lastRun: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: workflowIdCounter++,
      name: 'Escalate overdue tasks',
      description: 'When a task is past its due date, escalate to admin and mark as blocked',
      trigger: 'schedule_daily',
      conditions: [{ field: 'due_date', operator: 'past_due' }],
      actions: [
        { type: 'notify', target: 'admin', message: 'Task overdue: {{task.title}}' },
        { type: 'update_task', field: 'status', value: 'blocked' },
      ],
      enabled: true,
      runs: 12,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: workflowIdCounter++,
      name: 'Auto-execute marketing agent tasks',
      description: 'Automatically execute tasks assigned to marketing agent',
      trigger: 'task_assigned_to_agent',
      conditions: [{ field: 'department', operator: 'equals', value: 'Marketing' }],
      actions: [{ type: 'execute_agent', delay: '5m' }],
      enabled: false,
      runs: 0,
      lastRun: null,
    },
    {
      id: workflowIdCounter++,
      name: 'Welcome new team members',
      description: 'Send welcome message when a new user registers',
      trigger: 'user_registered',
      conditions: [],
      actions: [
        { type: 'send_message', channel: 'general', message: 'Welcome {{user.name}} to the team! 🎉' },
      ],
      enabled: true,
      runs: 1,
      lastRun: new Date(Date.now() - 36000000).toISOString(),
    },
  ];
}

seedWorkflows();

/**
 * Get all workflows
 */
function getWorkflows() {
  return workflows;
}

/**
 * Create workflow
 */
function createWorkflow(data) {
  const workflow = {
    id: workflowIdCounter++,
    name: data.name,
    description: data.description || '',
    trigger: data.trigger,
    conditions: data.conditions || [],
    actions: data.actions || [],
    enabled: data.enabled !== false,
    runs: 0,
    lastRun: null,
    createdAt: new Date().toISOString(),
  };
  workflows.push(workflow);
  return workflow;
}

/**
 * Update workflow
 */
function updateWorkflow(id, data) {
  const wf = workflows.find(w => w.id === parseInt(id));
  if (!wf) return null;
  Object.assign(wf, data);
  return wf;
}

/**
 * Delete workflow
 */
function deleteWorkflow(id) {
  workflows = workflows.filter(w => w.id !== parseInt(id));
  return true;
}

/**
 * Toggle workflow
 */
function toggleWorkflow(id) {
  const wf = workflows.find(w => w.id === parseInt(id));
  if (wf) wf.enabled = !wf.enabled;
  return wf;
}

/**
 * Evaluate conditions against context
 */
function evaluateConditions(conditions, context) {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(cond => {
    const value = context[cond.field];
    switch (cond.operator) {
      case 'equals': return value === cond.value;
      case 'not_equals': return value !== cond.value;
      case 'contains': return String(value).includes(cond.value);
      case 'greater_than': return Number(value) > Number(cond.value);
      case 'less_than': return Number(value) < Number(cond.value);
      case 'past_due': return value && new Date(value) < new Date();
      case 'exists': return value !== null && value !== undefined;
      default: return false;
    }
  });
}

/**
 * Execute actions
 */
function executeActions(actions, context) {
  const results = [];

  for (const action of actions) {
    try {
      let message = action.message || '';
      // Template replacement
      message = message.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, obj, field) => {
        return context[obj]?.[field] || `[${obj}.${field}]`;
      });

      switch (action.type) {
        case 'notify':
          results.push({ type: 'notify', target: action.target, message, success: true });
          break;
        case 'update_task':
          if (context.taskId) {
            db.prepare(`UPDATE tasks SET ${action.field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
              .run(action.value, context.taskId);
            results.push({ type: 'update_task', field: action.field, value: action.value, success: true });
          }
          break;
        case 'send_message':
          db.prepare("INSERT INTO messages (channel, sender_type, sender_id, content) VALUES (?, 'agent', 0, ?)")
            .run(action.channel || 'general', message);
          results.push({ type: 'send_message', channel: action.channel, success: true });
          break;
        case 'create_task':
          db.prepare("INSERT INTO tasks (title, description, priority, department_id, created_by) VALUES (?, ?, ?, ?, 1)")
            .run(message, action.description || '', action.priority || 'medium', action.department_id || null);
          results.push({ type: 'create_task', success: true });
          break;
        default:
          results.push({ type: action.type, success: false, error: 'Unknown action' });
      }
    } catch (err) {
      results.push({ type: action.type, success: false, error: err.message });
    }
  }

  return results;
}

/**
 * Process a trigger event
 */
function processTrigger(triggerName, context = {}) {
  const matchedWorkflows = workflows.filter(w => w.enabled && w.trigger === triggerName);
  const results = [];

  for (const wf of matchedWorkflows) {
    if (evaluateConditions(wf.conditions, context)) {
      const actionResults = executeActions(wf.actions, context);
      wf.runs++;
      wf.lastRun = new Date().toISOString();

      const log = {
        workflowId: wf.id,
        workflowName: wf.name,
        trigger: triggerName,
        context,
        actions: actionResults,
        timestamp: new Date().toISOString(),
      };
      executionLog.unshift(log);
      if (executionLog.length > 100) executionLog = executionLog.slice(0, 100);

      results.push(log);
    }
  }

  return results;
}

/**
 * Get execution log
 */
function getExecutionLog(limit = 20) {
  return executionLog.slice(0, limit);
}

/**
 * Get workflow stats
 */
function getWorkflowStats() {
  return {
    total: workflows.length,
    enabled: workflows.filter(w => w.enabled).length,
    disabled: workflows.filter(w => !w.enabled).length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runs, 0),
    recentExecutions: executionLog.slice(0, 5),
  };
}

module.exports = {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  processTrigger,
  getExecutionLog,
  getWorkflowStats,
};
