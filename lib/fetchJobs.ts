// lib/fetchJobs.ts

// Self-contained Job type (no external imports)
export type Job = {
  id: string;
  title: string;
  businessName: string;
  businessUrl?: string;
  category?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  streetAddress?: string;
  description?: string;
  datePosted?: string;   // ISO
  validThrough?: string; // ISO
  employmentType?: string;
  baseSalary?: string;
  applyUrl?: string;
  email?: string;
};

const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function toISO(dateLike?: string) {
  if (!dateLike) return undefined;
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
function firstDefined<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v as T;
  }
  return undefined;
}

// RFC-4180-ish CSV parser (handles quotes, commas, newlines, double quotes)
function parseCSV(text: string): any[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // escaped quote
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        // ignore CR; LF will handle the row end
      } else {
        field += c;
      }
    }
  }

  // flush last field/row
  if (inQuotes) {
    // unclosed quote — best effort: close row
    inQuotes = false;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // remove empty trailing rows
  while (rows.length && rows[rows.length - 1].every((f) => f.trim() === '')) {
    rows.pop();
  }
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const out: any[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cur = rows[r];
    if (cur.every((f) => f.trim() === '')) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cur[c] ?? '').trim();
    }
    out.push(obj);
  }
  return out;
}

// Try JSON first; if it fails, parse CSV
async function fetchRaw(): Promise<any[]> {
  if (!SHEET_URL) throw new Error('Missing SHEET_URL env var');
  const res = await fetch(SHEET_URL, { cache: 'no-store' });
  const text = await res.text();

  // JSON (array or { data: [...] })
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json as any[];
    if (Array.isArray((json as any).data)) return (json as any).data as any[];
  } catch {
    // Not JSON; fall through
  }

  // CSV
  return parseCSV(text);
}

export async function getJobs(): Promise<Job[]> {
  const rows = await fetchRaw();

  const jobs: Job[] = rows.map((row: any, i: number) => {
    const n: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => (n[normalizeKey(k)] = row[k]));

    const title = firstDefined<string>(n.job_title, n.title, n.position, n.role);
    const businessName = firstDefined<string>(n.business_name, n.company, n.employer, n.organization);

    const id = slugify([businessName, title, n.city, n.state, i].filter(Boolean).join('-'));

    const job: Job = {
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
      email: firstDefined(n.apply_email, n.email),
    };

    return job;
  });

  // Filter out rows without core fields
  return jobs.filter((j) => j.title && j.businessName);
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const jobs = await getJobs();
  return jobs.find((j) => j.id === id);
}

export async function getCategories(): Promise<string[]> {
  const jobs = await getJobs();
  return jobs.map((j) => j.category).filter(Boolean) as string[];
}
