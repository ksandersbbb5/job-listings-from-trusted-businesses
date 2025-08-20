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

// Split "123 Main St, Boston, MA 02110" into parts
function splitAddress(full) {
  if (!full) return {};
  const m = String(full).match(/^(.*?),(?:\s*)(.*?),(?:\s*)([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/i);
  if (!m) return { streetAddress: full };
  return { streetAddress: m[1], city: m[2], state: m[3], postalCode: m[4] };
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
  while (rows.length && rows[rows.length - 1].every(f => f.trim() === '')) rows.pop();
  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cur = rows[r];
    if (!cur || cur.every(f => (f ?? '').trim() === '')) continue;
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

  // If HTML sneaks in, fail loudly
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

function asNumber(s) {
  if (!s) return undefined;
  const n = Number(String(s).replace(/[^\d.]/g, ''));
  return isNaN(n) ? undefined : n;
}
function unitToSchema(unit) {
  const u = String(unit || '').toLowerCase();
  if (u.includes('hour')) return 'HOUR';
  if (u.includes('day')) return 'DAY';
  if (u.includes('week')) return 'WEEK';
  if (u.includes('month')) return 'MONTH';
  if (u.includes('year') || u.includes('annum')) return 'YEAR';
  return undefined;
}

export async function getJobs() {
  const rows = await fetchRaw();
  if (!rows.length) return [];

  const normalized = rows.map(row => {
    const n = {};
    Object.keys(row || {}).forEach(k => (n[normalizeKey(k)] = row[k]));
    return n;
  });

  return normalized.map((n, i) => {
    // Your exact headers (normalized)
    const title = firstDefined(n.position_title, n.job_title, n.title, n.position);
    const businessName = firstDefined(n.business_name, n.company, n.employer, n.organization, n.business);
    const businessUrl = firstDefined(n.business_website_address, n.website, n.business_url, n.company_url, n.employer_url);
    const fullAddress = firstDefined(n.position_location_address, n.address, n.street_address);
    const s = splitAddress(fullAddress);

    const idBase = [businessName, title, s.city, s.state].filter(Boolean).join('-');
    const id = idBase ? slugify(idBase) : `job-${i + 1}`;

    const baseComp = firstDefined(n.base_compensation, n.salary, n.base_salary, n.compensation);
    const baseCompUnit = firstDefined(n.base_compensation_unit, n.unit, n.pay_unit);
    const compType = firstDefined(n.compensation_type);
    const amount = asNumber(baseComp);
    const unitText = unitToSchema(baseCompUnit);

    const applyUrl = firstDefined(n.apply_url, n.application_url, n.url, n.job_url, n.listing_url, businessUrl);

    return {
      id,
      // Primary display
      title: title || 'Job Opening',
      businessName: businessName || 'BBB Accredited Business',
      category: firstDefined(n.job_category, n.category, n.department),
      description: firstDefined(n.position_description, n.description, n.job_description, n.summary),
      qualifications: n.position_qualifications,
      employmentType: n.employment_type,
      jobLocationType: n.job_location_type, // Remote/Hybrid/Onsite
      benefits: n.benefits,
      workingHours: n.working_hours,
      education: n.educational_requirements,
      experienceMonths: n.months_of_experience_required,
      businessUrl,
      logoUrl: n.business_logo,

      // Contact
      contactName: n.contact_name,
      contactTitle: n.contact_title,
      email: n.contact_email,
      phone: n.contact_phone_number,

      // Dates
      datePosted: toISO(firstDefined(n.date_posted, n.created)),
      validThrough: toISO(firstDefined(n.posting_expires_on)),

      // Location
      streetAddress: s.streetAddress,
      city: s.city,
      state: s.state,
      postalCode: s.postalCode,

      // Salary
      baseCompensation: baseComp,
      baseCompensationUnit: baseCompUnit,
      compensationType: compType,
      baseSalaryValue: amount,
      baseSalaryUnitText: unitText,

      // Links
      applyUrl,
      status: n.status
    };
  }).filter(j => j.title || j.businessName);
}

export async function getJobById(id) {
  const jobs = await getJobs();
  return jobs.find(j => j.id === id);
}

// Debug helper
export async function _debugFetchRaw() {
  return fetchRaw();
}
