// lib/fetchJobs.js
const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;

function stripBOM(text) {
  if (text && text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
function toISO(dateLike) {
  if (!dateLike) return undefined;
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
function normalizeKey(key) {
  return String(key || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
}

// Heuristic helpers to find likely columns by header text
function findKey(keys, ...patterns) {
  const joined = patterns.map(p => (p instanceof RegExp ? p : new RegExp(p, 'i')));
  // exact match first
  for (const k of keys) {
    if (joined.some(rx => rx.test(k))) return k;
  }
  return undefined;
}
function findBest(keys, candidates) {
  // candidates is array of regex strings in priority order
  for (const p of candidates) {
    const rx = new RegExp(p, 'i');
    const hit = keys.find(k => rx.test(k));
    if (hit) return hit;
  }
  return undefined;
}

// RFC-4180-ish CSV parser (handles quotes, commas, CRLF)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore CR */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every(f => f.trim() === '')) rows.pop();
  if (!rows.length) return [];

  cons
