// lib/fetchJobs.ts
import Papa from 'papaparse';

// Self-contained Job type (avoids alias/import issues)
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

// Try JSON first; if it fails, parse CSV
async function fetchRaw(): Promise<any[]> {
  if (!SHEET_URL) throw new Error('Missing SHEET_URL env var');
  const res = await fetch(SHEET_URL, { cache: 'no-store' });
  const text = await res.text();

  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray((json as any).data)) return (json as any).data;
  } catch {
    // Not JSON; fall through to CSV
  }

  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return (parsed.data as any[]) || [];
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
