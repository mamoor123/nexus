/**
 * TOON — Token-Oriented Object Notation for HiveOps
 * 
 * Compact, human-readable encoding of JSON data for LLM prompts.
 * Reduces token usage by ~40% compared to JSON while maintaining accuracy.
 * 
 * Usage:
 *   const { encode, decode, encodeForPrompt } = require('./toon');
 *   
 *   // Encode structured data for LLM prompts
 *   const toon = encode(taskData);
 *   
 *   // Decode back to JSON
 *   const json = decode(toon);
 *   
 *   // Build a complete LLM-ready context block
 *   const prompt = encodeForPrompt({ tasks, comments, department });
 */

'use strict';

// ─── Encoder (JSON → TOON) ───────────────────────────────────────────

function encode(obj, indent = 0) {
  const pad = ' '.repeat(indent);

  if (obj === null) return pad + 'null';
  if (typeof obj === 'boolean') return pad + String(obj);
  if (typeof obj === 'number') return pad + String(obj);
  if (typeof obj === 'string') return pad + quote(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return pad + '[]';

    // Uniform array of primitives → inline
    if (obj.every(v => typeof v !== 'object' || v === null)) {
      return pad + `items[${obj.length}]: ${obj.map(v => v === null ? 'null' : quote(String(v))).join(',')}`;
    }

    // Uniform array of objects → tabular
    if (isPlainObject(obj[0])) {
      const fields = Object.keys(obj[0]);
      const isUniform = obj.every(item =>
        isPlainObject(item) &&
        arraysEqual(Object.keys(item).sort(), fields.slice().sort())
      );
      if (isUniform && fields.length > 0) {
        const lines = [pad + `items[${obj.length}]{${fields.join(',')}}:`];
        for (const item of obj) {
          const vals = fields.map(f => formatValue(item[f]));
          lines.push(pad + ' ' + vals.join(','));
        }
        return lines.join('\n');
      }
    }

    // Non-uniform or nested → each item on its own line
    const lines = [pad + `items[${obj.length}]:`];
    for (const item of obj) {
      lines.push(encode(item, indent + 1));
    }
    return lines.join('\n');
  }

  if (isPlainObject(obj)) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return pad + '{}';

    const lines = [];
    for (const key of keys) {
      const val = obj[key];

      if (val === null || val === undefined) {
        lines.push(pad + `${key}: null`);
      } else if (isPlainObject(val)) {
        lines.push(pad + `${key}:`);
        lines.push(encode(val, indent + 1));
      } else if (Array.isArray(val)) {
        if (val.length === 0) {
          lines.push(pad + `${key}[0]:`);
        } else if (val.every(v => typeof v !== 'object' || v === null)) {
          // Simple array inline
          const vals = val.map(v => v === null ? 'null' : quote(String(v)));
          lines.push(pad + `${key}[${val.length}]: ${vals.join(',')}`);
        } else if (val.length > 0 && isPlainObject(val[0])) {
          // Try tabular
          const fields = Object.keys(val[0]);
          const isUniform = val.every(item =>
            isPlainObject(item) &&
            arraysEqual(Object.keys(item).sort(), fields.slice().sort())
          );
          if (isUniform && fields.length > 0) {
            lines.push(pad + `${key}[${val.length}]{${fields.join(',')}}:`);
            for (const item of val) {
              const vals = fields.map(f => formatValue(item[f]));
              lines.push(pad + ' ' + vals.join(','));
            }
          } else {
            lines.push(pad + `${key}[${val.length}]:`);
            for (const item of val) {
              lines.push(encode(item, indent + 1));
            }
          }
        } else {
          lines.push(pad + `${key}[${val.length}]:`);
          for (const item of val) {
            lines.push(encode(item, indent + 1));
          }
        }
      } else {
        const v = typeof val === 'string' ? quote(val) : String(val);
        lines.push(pad + `${key}: ${v}`);
      }
    }
    return lines.join('\n');
  }

  return pad + String(obj);
}

// ─── Decoder (TOON → JSON) ───────────────────────────────────────────

function decode(toonStr) {
  if (!toonStr || typeof toonStr !== 'string') return {};
  const lines = toonStr.split('\n');
  const ctx = { idx: 0 };
  return parseBlock(lines, 0, ctx).value;
}

function parseBlock(lines, baseIndent, ctx) {
  const obj = {};

  while (ctx.idx < lines.length) {
    const line = lines[ctx.idx];
    if (!line || line.trim() === '') { ctx.idx++; continue; }

    const indent = countIndent(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) break;

    const parsed = parseLine(line.trim());
    if (!parsed) { ctx.idx++; continue; }

    if (parsed.type === 'tabular') {
      const arr = [];
      ctx.idx++;
      while (ctx.idx < lines.length) {
        const rLine = lines[ctx.idx];
        if (!rLine || rLine.trim() === '') { ctx.idx++; continue; }
        if (countIndent(rLine) <= baseIndent) break;
        const vals = parseCsvRow(rLine.trim());
        const row = {};
        parsed.fields.forEach((f, i) => { row[f] = parsePrimitive(vals[i] ?? ''); });
        arr.push(row);
        ctx.idx++;
      }
      obj[parsed.key] = arr;
      continue;
    }

    if (parsed.type === 'simple-array') {
      obj[parsed.key] = parsed.value;
      ctx.idx++;
      continue;
    }

    if (parsed.type === 'nested') {
      ctx.idx++;
      const child = parseBlock(lines, baseIndent + 1, ctx);
      obj[parsed.key] = child.value;
      continue;
    }

    if (parsed.type === 'primitive') {
      obj[parsed.key] = parsed.value;
      ctx.idx++;
      continue;
    }

    ctx.idx++;
  }

  return { value: obj };
}

function parseLine(line) {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;

  let key = line.substring(0, colonIdx).trim();
  let rest = line.substring(colonIdx + 1).trim();

  // Tabular or simple array: key[N]{f1,f2}: or key[N]:
  const arrMatch = key.match(/^(\w+)\[(\d+)\](?:\{(.+?)\})?$/);
  if (arrMatch) {
    key = arrMatch[1];
    const fields = arrMatch[3];
    if (fields) {
      if (!rest) return { key, type: 'tabular', fields: fields.split(',').map(f => f.trim()) };
      // Inline single row
      const vals = parseCsvRow(rest);
      const row = {};
      fields.split(',').forEach((f, i) => { row[f.trim()] = parsePrimitive(vals[i] ?? ''); });
      return { key, type: 'primitive', value: [row] };
    }
    if (rest) {
      const vals = parseCsvRow(rest);
      return { key, type: 'simple-array', value: vals.map(v => parsePrimitive(v)) };
    }
    return { key, type: 'nested' };
  }

  if (!rest) return { key, type: 'nested' };

  return { key, type: 'primitive', value: parsePrimitive(rest) };
}

function parseCsvRow(str) {
  const result = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"') {
      inQuote = !inQuote;
    } else if (str[i] === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += str[i];
    }
  }
  result.push(current.trim());
  return result;
}

function parsePrimitive(str) {
  if (!str || str === 'null') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;
  // Numbers: integers and floats
  if (/^-?\d+(\.\d+)?$/.test(str)) return Number(str);
  // Quoted strings
  if ((str.startsWith('"') && str.endsWith('"'))) return str.slice(1, -1);
  return str;
}

function countIndent(line) {
  let count = 0;
  for (const ch of line) {
    if (ch === ' ') count++; else break;
  }
  return count;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Format a value for TOON encoding — preserves original type.
 * Numbers stay unquoted, strings that look like numbers get quoted.
 */
function formatValue(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return String(val);
  return quote(String(val));
}

function quote(str) {
  if (str === '' || str.includes(',') || str.includes('\n') || str.includes(':') ||
      str === 'true' || str === 'false' || str === 'null' ||
      /^-?\d+(\.\d+)?$/.test(str)) {
    return `"${str}"`;
  }
  return str;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ─── Token Estimation ────────────────────────────────────────────────

function estimateTokens(str) {
  if (!str) return 0;
  return Math.ceil(str.length / 3.5);
}

function tokenStats(jsonStr, toonStr) {
  const jsonTokens = estimateTokens(jsonStr);
  const toonTokens = estimateTokens(toonStr);
  return {
    json: { chars: jsonStr.length, tokens: jsonTokens },
    toon: { chars: toonStr.length, tokens: toonTokens },
    saved: jsonTokens > 0 ? Math.round((1 - toonTokens / jsonTokens) * 100) : 0,
  };
}

// ─── High-Level API for HiveOps ──────────────────────────────────────

/**
 * Build a TOON-encoded context block for LLM prompts.
 * Replaces manual string concatenation in ai-engine.js.
 * 
 * @param {Object} data - { task, department, comments, agents, messages, ... }
 * @returns {string} TOON-encoded prompt context
 */
function encodeForPrompt(data) {
  const sections = [];

  if (data.task) {
    sections.push('## Task');
    sections.push(encode(flattenForPrompt(data.task)));
  }

  if (data.department) {
    sections.push('## Department');
    sections.push(encode(flattenForPrompt(data.department)));
  }

  if (data.comments && data.comments.length > 0) {
    sections.push('## Recent Comments');
    sections.push(encode(data.comments.map(c => ({
      by: c.user_name || c.agent_name || 'Unknown',
      text: c.content?.slice(0, 200) || '',
      at: c.created_at || '',
    }))));
  }

  if (data.messages && data.messages.length > 0) {
    sections.push('## Conversation History');
    sections.push(encode(data.messages.map(m => ({
      role: m.sender_type === 'agent' ? 'agent' : 'user',
      text: m.content?.slice(0, 200) || '',
    }))));
  }

  if (data.agents && data.agents.length > 0) {
    sections.push('## Available Agents');
    sections.push(encode(data.agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role || '',
      dept: a.department_name || '',
      status: a.status || '',
    }))));
  }

  if (data.delegation) {
    sections.push('## Delegation');
    sections.push(encode(flattenForPrompt(data.delegation)));
  }

  if (data.workflow) {
    sections.push('## Workflow Context');
    sections.push(encode(flattenForPrompt(data.workflow)));
  }

  return sections.join('\n');
}

/**
 * Flatten an object for prompt display — remove internal IDs,
 * timestamps, and verbose fields that don't help the LLM.
 */
function flattenForPrompt(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const skip = new Set(['id', 'created_at', 'updated_at', 'created_by', 'assigned_agent_id',
    'system_prompt', 'model', 'department_id', 'agent_dept_id', 'execution_timeout_ms']);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (skip.has(k)) continue;
    if (v === null || v === undefined) continue;
    result[k] = v;
  }
  return result;
}

// ─── Exports ─────────────────────────────────────────────────────────

module.exports = {
  encode,
  decode,
  encodeForPrompt,
  flattenForPrompt,
  estimateTokens,
  tokenStats,
};
