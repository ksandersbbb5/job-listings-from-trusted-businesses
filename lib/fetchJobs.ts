import Papa from 'papaparse';

// Self-contained type so this file compiles even if path aliases aren't set
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
    const normalized: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => (normalized[normalizeKey(k)] = row[k]));

    const title = firstDefined<string>(
      normalized.job_title, normalized.title, normalized.position, normalized.role
    );
    const businessName = firstDefined<string>(
      normalized.business_name, normalized.company, normalized.employer, normalized.organization
    );

    const id = slugify(
      [businessName, title, normalized.city, normalized.state, i].filter(Boolean).join('-')
    );

    const job: Job = {
      id,
      title: title || 'Job Opening',
      businessName: businessName || 'BBB Accredited Business',
      businessUrl: firstDefined(
        normalized.business_url, normalized.company_url, normalized.website, normalized.employer_url
      ),
      category: firstDefined(normalized.category, normalized.job_category, normalized.department),
      city: firstDefined(normalized.city, normalized.town),
      state: firstDefined(
        normalized.state, normalized.region, normalized.province, normalized.state_code
      ),
      postalCode: firstDefined(normalized.zip, normalized.postal_code, normalized.zip_code),
      streetAddress: firstDefined(normalized.street, normalized.address, normalized.street_address),
      description: firstDefined(normalized.description, normalized.job_description, normalized.summary),
      datePosted: toISO(firstDefined(normalized.date_posted, normalized.posted, normalized.date)),
      validThrough: toISO(firstDefined(normalized.valid_through, normalized.expiration, normalized.expires)),
      employmentType: firstDefined(normalized.employment_type, normalized.type, normalized.job_type),
      baseSalary: firstDefined(normalized.salary, normalized.base_salary, normalized.compensation),
      applyUrl: firstDefined(normalized.apply_url, normalized.url, normalized.job_url, normalized.listing_url),
      email: firstDefined(normalized.apply_email, normalized.email),
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
