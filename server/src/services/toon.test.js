/**
 * TOON Service Tests
 * Run with: node server/src/services/toon.test.js
 */

'use strict';

const toon = require('./toon');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
  }
}

function assertEqual(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     expected: ${e}`);
    console.log(`     actual:   ${a}`);
  }
}

// ─── Primitives ──────────────────────────────────────────────────────

console.log('\n🔧 Primitives');
assertEqual('null', toon.encode(null), 'null');
assertEqual('boolean true', toon.encode(true), 'true');
assertEqual('boolean false', toon.encode(false), 'false');
assertEqual('number', toon.encode(42), '42');
assertEqual('string', toon.encode('hello'), 'hello');
assertEqual('string with comma', toon.encode('a, b'), '"a, b"');
assertEqual('empty string', toon.encode(''), '""');

// ─── Simple Objects ──────────────────────────────────────────────────

console.log('\n📦 Simple Objects');
const flatObj = { name: 'Alice', age: 30, active: true };
const flatToon = toon.encode(flatObj);
assert('flat object has no braces', !flatToon.includes('{') && !flatToon.includes('}'));
assert('flat object has name', flatToon.includes('name: Alice'));
assert('flat object has age', flatToon.includes('age: 30'));

// Roundtrip
const decoded = toon.decode(flatToon);
assertEqual('flat object roundtrip', decoded, flatObj);

// ─── Simple Arrays ───────────────────────────────────────────────────

console.log('\n📋 Simple Arrays');
const simpleArr = { tags: ['urgent', 'backend', 'bug'] };
const arrToon = toon.encode(simpleArr);
assert('simple array has length', arrToon.includes('tags[3]:'));
assertEqual('simple array roundtrip', toon.decode(arrToon), simpleArr);

// ─── Tabular Arrays (the big one) ────────────────────────────────────

console.log('\n📊 Tabular Arrays');
const employees = {
  department: 'Engineering',
  employees: [
    { name: 'Alice', role: 'Engineer', salary: 120000 },
    { name: 'Bob', role: 'Designer', salary: 95000 },
    { name: 'Carol', role: 'Manager', salary: 140000 },
  ]
};
const empToon = toon.encode(employees);
assert('tabular has field header', empToon.includes('{name,role,salary}'));
assert('tabular has row data', empToon.includes('Alice,Engineer,120000'));
assertEqual('tabular roundtrip', toon.decode(empToon), employees);

// ─── Nested Objects ──────────────────────────────────────────────────

console.log('\n🏗️ Nested Objects');
const nested = {
  app: { name: 'HiveOps', version: '3.0' },
  db: { host: 'localhost', port: 5432 }
};
const nestedToon = toon.encode(nested);
assert('nested has app:', nestedToon.includes('app:'));
assert('nested has db:', nestedToon.includes('db:'));
assertEqual('nested roundtrip', toon.decode(nestedToon), nested);

// ─── Real HiveOps Task Context ───────────────────────────────────────

console.log('\n🐝 HiveOps Task Context');
const taskContext = {
  task: {
    title: 'Fix login timeout',
    description: 'Users report 30s timeout on login endpoint',
    priority: 'high',
    status: 'pending',
  },
  department: {
    name: 'Engineering',
    description: 'Backend and infrastructure team',
  },
  comments: [
    { user_name: 'Alice', content: 'Looks like a connection pool issue', created_at: '2025-04-19T10:00:00Z' },
    { user_name: 'Bob', content: 'Confirmed — max connections hit at peak', created_at: '2025-04-19T11:00:00Z' },
    { agent_name: 'OpsBot', content: 'DB metrics show 95% pool utilization', created_at: '2025-04-19T11:30:00Z' },
  ],
};

const contextToon = toon.encodeForPrompt(taskContext);
assert('context has Task section', contextToon.includes('## Task'));
assert('context has Department section', contextToon.includes('## Department'));
assert('context has Comments section', contextToon.includes('## Recent Comments'));
assert('context does NOT have system_prompt', !contextToon.includes('system_prompt'));
assert('context does NOT have timestamps from task', !contextToon.includes('created_at'));

// ─── Token Comparison ────────────────────────────────────────────────

console.log('\n📊 Token Comparison');
const stats = toon.tokenStats(JSON.stringify(taskContext, null, 2), toon.encodeForPrompt(taskContext));
assert(`JSON tokens: ${stats.json.tokens}`, stats.json.tokens > 0);
assert(`TOON tokens: ${stats.toon.tokens}`, stats.toon.tokens > 0);
assert(`TOON saves tokens (${stats.saved}%)`, stats.saved > 0);
console.log(`     JSON: ${stats.json.chars} chars, ~${stats.json.tokens} tokens`);
console.log(`     TOON: ${stats.toon.chars} chars, ~${stats.toon.tokens} tokens`);
console.log(`     Saved: ${stats.saved}%`);

// ─── Agent Chat Context ──────────────────────────────────────────────

console.log('\n💬 Agent Chat Context');
const chatContext = {
  messages: [
    { sender_type: 'user', content: 'How do I deploy to production?' },
    { sender_type: 'agent', content: 'Run docker-compose up with production env vars' },
    { sender_type: 'user', content: 'What about database migrations?' },
    { sender_type: 'agent', content: 'Migrations run automatically on startup' },
  ],
};
const chatToon = toon.encodeForPrompt(chatContext);
assert('chat has Conversation History', chatToon.includes('## Conversation History'));
assert('chat has role labels', chatToon.includes('user') && chatToon.includes('agent'));

// ─── Delegation Context ──────────────────────────────────────────────

console.log('\n🤝 Delegation Context');
const delegationContext = {
  delegation: {
    from: 'Supervisor',
    fromRole: 'coordinator',
    message: 'Please review the deployment checklist for release v3.2',
  },
};
const delToon = toon.encodeForPrompt(delegationContext);
assert('delegation has section', delToon.includes('## Delegation'));
assert('delegation has from', delToon.includes('Supervisor'));

// ─── Empty/Edge Cases ────────────────────────────────────────────────

console.log('\n🔍 Edge Cases');
assertEqual('empty array', toon.encode({ items: [] }), 'items[0]:');
assertEqual('empty object', toon.encode({}), '{}');
assertEqual('decode empty string', toon.decode(''), {});
assertEqual('decode whitespace', toon.decode('   \n  \n  '), {});

// ─── Full Integration: Realistic Task Execution Prompt ───────────────

console.log('\n🚀 Integration: Realistic Prompt');

const fullContext = {
  task: {
    title: 'Migrate auth to OAuth2',
    description: 'Replace session-based auth with OAuth2 + PKCE',
    priority: 'urgent',
    status: 'pending',
  },
  department: {
    name: 'Security',
    description: 'Application security and compliance',
  },
  comments: [
    { user_name: 'sec-lead', content: 'We need this before the SOC2 audit on May 1', created_at: '2025-04-15' },
    { user_name: 'dev-ops', content: 'Keycloak is already deployed, just need the integration', created_at: '2025-04-16' },
  ],
};

const fullToon = toon.encodeForPrompt(fullContext);
const fullJson = JSON.stringify(fullContext, null, 2);
const fullStats = toon.tokenStats(fullJson, fullToon);

console.log(`\n  Full prompt comparison:`);
console.log(`  JSON: ${fullStats.json.chars} chars, ~${fullStats.json.tokens} tokens`);
console.log(`  TOON: ${fullStats.toon.chars} chars, ~${fullStats.toon.tokens} tokens`);
console.log(`  Saved: ${fullStats.saved}%`);
assert(`Full prompt saves >25% tokens (actual: ${fullStats.saved}%)`, fullStats.saved > 25);

// ─── Summary ─────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
