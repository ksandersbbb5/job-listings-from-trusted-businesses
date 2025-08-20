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

// RFC-4180-ish CSV parser
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
      else if (c === '\r') { /* ignore */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every((f) => f.trim() === '')) rows.pop();
  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cur = rows[r];
    if (!cur || cur.every((f) => (f ?? '').trim() === '')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = (cur[c] ?? '').trim();
    out.push(obj);
  }
  return out;
}

async function fetchRaw() {
  if (!SHEET_URL) throw new Error('Missing SHEET_URL env var');
  const r = await fetch(SHEET_URL, { cache: 'no-store' });
  const rawText = await r.text();
  const text = stripBOM(rawText);
  const ct = (r.headers.get('content-type') || '').toLowerCase();

  if (ct.includes('text/html') || /^<!doctype html/i.test(text) || /<html/i.test(text)) {
    throw new Error('SHEET_URL returned HTML. Use a published CSV/JSON URL.');
  }

  // Try JSON first
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
  } catch {
    // not JSON → parse CSV
  }
  return parseCSV(text);
}

function findBest(keys, candidates) {
  for (const p of candidates) {
    const rx = new RegExp(p, 'i');
    const hit = keys.find((k) => rx.test(k));
    if (hit) return hit;
  }
  return undefined;
}

export async function getJobs() {
  const rows = await fetchRaw();
  if (!rows.length) return [];

  // Normalize rows and gather keys
  const normalizedRows = rows.map((row) => {
    const n = {};
    Object.keys(row || {}).forEach((k) => (n[normalizeKey(k)] = row[k]));
    return n;
  });
  const allKeys = Array.from(
    normalizedRows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set())
  );

  // Heuristics to map your headers
  const businessKey =
    findBest(allKeys, ['^business(_name)?$', '^company(_name)?$', '^employer$', '^organization$', 'business', 'company']) ||
    'business_name';
  const titleKey =
    findBest(allKeys, ['^job(_)?title$', '^title$', '^position$', '^role$', 'job', 'opening']) || 'job_title';
  const cityKey = findBest(allKeys, ['^city$', 'locality', 'town']) || 'city';
  const stateKey = findBest(allKeys, ['^state$', 'region', 'province', 'state_code']) || 'state';
  const zipKey = findBest(allKeys, ['^zip$', '^postal(_)?code$', 'zipcode', 'zip_code']) || 'zip';
  const descKey = findBest(allKeys, ['^description$', 'job_description', 'summary', 'about']) || 'description';
  const urlKey = findBest(allKeys, ['^apply(_)?url$', '^url$', 'job_url', 'listing_url', 'application_url', 'link']) || 'apply_url';
  const websiteKey = findBest(allKeys, ['^website$', 'business_url', 'company_url', 'employer_url']) || 'website';
  const datePostedKey = findBest(allKeys, ['^date(_)?posted$', '^posted$', '^date$']) || 'date_posted';
  const validThroughKey = findBest(allKeys, ['^valid(_)?through$', 'expiration', 'expires']) || 'valid_through';
  const typeKey = findBest(allKeys, ['^employment(_)?type$', '^type$', 'job_type']) || 'employment_type';
  const salaryKey = findBest(allKeys, ['^salary$', 'base_salary', 'compensation', 'pay']) || 'salary';
  const streetKey = findBest(allKeys, ['^street$', 'address', 'street_address', 'addr']) || 'street';
  const emailKey = findBest(allKeys, ['^apply(_)?email$', '^email$']) || 'apply_email';
  const categoryKey = findBest(allKeys, ['^category$', 'job_category', 'department']) || 'category';

  const jobs = normalizedRows.map((n, i) => {
    const title = firstDefined(n[titleKey], n.title, n.position, n.role);
    const businessName = firstDefined(n[businessKey], n.company, n.employer, n.organization, n.business);

    const baseForId = [businessName, title, n[cityKey], n[stateKey]].filter(Boolean).join('-');
    const id = baseForId ? slugify(baseForId) : `job-${i + 1}`;

    return {
      id,
      title: title || 'Job Opening',
      businessName: businessName || 'BBB Accredited Business',
      businessUrl: firstDefined(n[websiteKey], n.business_url, n.company_url, n.employer_url),
      category: n[categoryKey],
      city: n[cityKey],
      state: n[stateKey],
      postalCode: n[zipKey],
      streetAddress: n[streetKey],
      description: n[descKey],
      datePosted: toISO(n[datePostedKey]),
      validThrough: toISO(n[validThroughKey]),
      employmentType: n[typeKey],
      baseSalary: n[salaryKey],
      applyUrl: firstDefined(n[urlKey], n.url, n.job_url, n.listing_url),
      email: n[emailKey]
    };
  });

  return jobs.filter((j) => j.title || j.businessName);
}

export async function getJobById(id) {
  const jobs = await getJobs();
  return jobs.find((j) => j.id === id);
}

// Debug helper (used by /api/debug-rows)
export async function _debugFetchRaw() {
  return fetchRaw();
}
