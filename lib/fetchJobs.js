// lib/fetchJobs.js
const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;

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

// CSV parser (RFC-4180-ish)
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
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every((f) => f.trim() === '')) rows.pop();
  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cur = rows[r];
    if (cur.every((f) => f.trim() === '')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = (cur[c] ?? '').trim();
    out.push(obj);
  }
  return out;
}

// Parse Google Sheets gviz JSON: /*O_o*/ google.visualization.Query.setResponse({...});
function parseGvizJSON(text) {
  // Find the first { and last } to extract the JSON
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('Invalid gviz JSON');
  const json = JSON.parse(text.slice(start, end + 1));

  const cols = (json.table?.cols || []).map((c) => c?.label || c?.id || '');
  const out = [];
  for (const row of json.table?.rows || []) {
    const obj = {};
    (row.c || []).forEach((cell, idx) => {
      const key = cols[idx] || `col_${idx}`;
      obj[key] = cell?.v != null ? String(cell.v) : '';
    });
    out.push(obj);
  }
  return out;
}

async function fetchRaw() {
  if (!SHEET_URL) throw new Error('Missing SHEET_URL env var');
  const r = await fetch(SHEET_URL, { cache: 'no-store' });
  const text = await r.text();
  const ct = (r.headers.get('content-type') || '').toLowerCase();

  // Guard: if HTML, tell the user to use CSV/JSON, not an app/page URL
  if (ct.includes('text/html') || /^<!doctype html/i.test(text) || /<html/i.test(text)) {
    throw new Error('SHEET_URL returns HTML. Provide a direct CSV or JSON URL (see notes below).');
  }

  // Plain JSON array or { data: [...] }
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
  } catch {}

  // Google Sheets gviz JSON
  if (text.includes('google.visualization.Query.setResponse')) {
    return parseGvizJSON(text);
  }

  // Fallback: CSV
  return parseCSV(text);
}

export async function getJobs() {
  const rows = await fetchRaw();

  const jobs = rows.map((row, i) => {
    const n = {};
    Object.keys(row || {}).forEach((k) => (n[normalizeKey(k)] = row[k]));

    const title = firstDefined(n.job_title, n.title, n.position, n.role);
    const businessName = firstDefined(n.business_name, n.company, n.employer, n.organization, n.business);

    const id = slugify([businessName, title, n.city, n.state, i].filter(Boolean).join('-'));

    return {
      id,
      title: title || 'Job Opening',
      businessName: businessName || 'BBB Accredited Business',
      businessUrl: firstDefined(n.business_url, n.company_url, n.website, n.employer_url),
      category: firstDefined(n.category, n.job_category, n.department),
      city: firstDefined(n.city, n.town),
      state: firstDefined(n.state, n.region, n.province, n.state_code),
      postalCode: firstDefined(n.zip, n.postal_code, n.zip_code),
      streetAddress: firstDefined(n.street, n.address, n.street_address),
      description: firstDefined(n.description, n.job_description, n.summary),
      datePosted: toISO(firstDefined(n.date_posted, n.posted, n.date)),
      validThrough: toISO(firstDefined(n.valid_through, n.expiration, n.expires)),
      employmentType: firstDefined(n.employment_type, n.type, n.job_type),
      baseSalary: firstDefined(n.salary, n.base_salary, n.compensation),
      applyUrl: firstDefined(n.apply_url, n.url, n.job_url, n.listing_url),
      email: firstDefined(n.apply_email, n.email)
    };
  });

  // filter out empty rows
  return jobs.filter((j) => j.title && j.businessName);
}

// Expose for /api/debug-rows
export async function _debugFetchRaw() {
  return fetchRaw();
}
