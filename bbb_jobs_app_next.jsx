// =============================================
// BBB Jobs App — Next.js 14 (App Router) + Vercel
// Full project in one file; copy each section into the indicated path.
// =============================================

// ---------- file: package.json ----------
{
  "name": "bbb-jobs-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "papaparse": "5.4.1"
  },
  "devDependencies": {
    "@types/node": "20.14.9",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "typescript": "5.5.3"
  }
}

// ---------- file: next.config.ts ----------
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
};
export default nextConfig;

// ---------- file: tsconfig.json ----------
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/lib/*": ["lib/*"],
      "@/types": ["types.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}

// ---------- file: public/README.txt ----------
// Place your provided BBB logo at public/bbb-logo.png
// (You can use the attached bluechatlogo.png and save as /public/bbb-logo.png)

// ---------- file: app/globals.css ----------
:root { --bbb-blue: #015e73; --bbb-bg: #f6fafa; }
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: var(--bbb-bg); color: #0b1f26; }
.container { max-width: 1100px; margin: 0 auto; padding: 1.25rem; }
.header { display:flex; align-items:center; gap: 1rem; padding: 1rem 0; }
.header h1 { margin:0; font-size: clamp(1.2rem, 1.5vw + 1rem, 2rem); }
.logo { width: 56px; height: 56px; border-radius: 12px; background:#084f5a; display:grid; place-items:center; overflow:hidden; }
.card { background:white; border-radius: 16px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e3eef1; }
.grid { display:grid; gap: 1rem; }
.jobs-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.label { font-weight: 600; font-size: 0.86rem; color:#084f5a; }
.input, select { width:100%; padding:0.65rem 0.8rem; border:1px solid #cfe3e9; border-radius: 12px; outline:none; background:white; }
.input:focus, select:focus { border-color: var(--bbb-blue); box-shadow: 0 0 0 3px rgba(1,94,115,0.15); }
.button { appearance:none; border:1px solid transparent; background: var(--bbb-blue); color:white; padding:0.7rem 1rem; border-radius:12px; cursor:pointer; font-weight:600; }
.button.secondary { background:white; color: var(--bbb-blue); border-color:#b5d6de; }
.pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.25rem 0.55rem; border-radius: 999px; font-size: 0.78rem; border:1px solid #d5e7ec; background:#f3fafc; }
.badge { background:#edf7f9; color:#0b3945; border:1px solid #cbe6ed; border-radius:10px; padding:0.2rem 0.5rem; font-size:0.75rem; }
.footer { color:#4b6b74; font-size:0.85rem; text-align:center; padding:2rem 0; }

// ---------- file: types.ts ----------
export type Job = {
  id: string; // stable slug/id
  title: string;
  businessName: string;
  businessUrl?: string;
  category?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  streetAddress?: string;
  description?: string;
  datePosted?: string; // ISO
  validThrough?: string; // ISO
  employmentType?: string; // e.g., FULL_TIME
  baseSalary?: string; // e.g., "$60,000 - $75,000"
  applyUrl?: string;
  email?: string; // fallback
};

// ---------- file: lib/utils.ts ----------
export function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
export function toISO(dateLike?: string) {
  if (!dateLike) return undefined;
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
export function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

// ---------- file: lib/fetchJobs.ts ----------
import Papa from 'papaparse';
import { Job } from '@/types';
import { slugify, toISO } from '@/lib/utils';

const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

// Try JSON first; if it fails, try CSV
async function fetchRaw(): Promise<any[]> {
  if (!SHEET_URL) throw new Error('Missing SHEET_URL env var');
  const res = await fetch(SHEET_URL, { cache: 'no-store' });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray((json as any).data)) return (json as any).data;
  } catch { /* not JSON */ }
  // parse CSV
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    // non-fatal: still try to return rows
  }
  return parsed.data as any[];
}

function firstDefined<T>(...vals: (T | undefined)[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v as T;
  return undefined;
}

export async function getJobs(): Promise<Job[]> {
  const rows = await fetchRaw();
  const jobs: Job[] = rows.map((row: any, i: number) => {
    const normalized: Record<string, any> = {};
    Object.keys(row || {}).forEach(k => (normalized[normalizeKey(k)] = row[k]));

    const title = firstDefined(
      normalized.job_title, normalized.title, normalized.position, normalized.role
    ) as string | undefined;
    const businessName = firstDefined(
      normalized.business_name, normalized.company, normalized.employer, normalized.organization
    ) as string | undefined;

    const id = slugify(
      [businessName, title, normalized.city, normalized.state, i].filter(Boolean).join('-')
    );

    const job: Job = {
      id,
      title: title || 'Job Opening',
      businessName: businessName || 'BBB Accredited Business',
      businessUrl: firstDefined(normalized.business_url, normalized.company_url, normalized.website, normalized.employer_url),
      category: firstDefined(normalized.category, normalized.job_category, normalized.department),
      city: firstDefined(normalized.city, normalized.town),
      state: firstDefined(normalized.state, normalized.region, normalized.province, normalized.state_code),
      postalCode: firstDefined(normalized.zip, normalized.postal_code, normalized.zip_code),
      streetAddress: firstDefined(normalized.street, normalized.address, normalized.street_address),
      description: firstDefined(normalized.description, normalized.job_description, normalized.summary),
      datePosted: toISO(firstDefined(normalized.date_posted, normalized.posted, normalized.date)),
      validThrough: toISO(firstDefined(normalized.valid_through, normalized.expiration, normalized.expires)),
      employmentType: firstDefined(normalized.employment_type, normalized.type, normalized.job_type),
      baseSalary: firstDefined(normalized.salary, normalized.base_salary, normalized.compensation),
      applyUrl: firstDefined(normalized.apply_url, normalized.url, normalized.job_url, normalized.listing_url),
      email: firstDefined(normalized.apply_email, normalized.email)
    };
    return job;
  });

  // Filter out empty rows with no meaningful title/company
  return jobs.filter(j => j.title && j.businessName);
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const jobs = await getJobs();
  return jobs.find(j => j.id === id);
}

export async function getCategories(): Promise<string[]> {
  const jobs = await getJobs();
  return jobs.map(j => j.category).filter(Boolean) as string[];
}

// ---------- file: app/layout.tsx ----------
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find and Apply for a Job with a BBB Trusted Accredited Business',
  description: 'Search open roles from BBB Accredited Businesses and apply with confidence. Built for Google Job Listing compatibility.',
  metadataBase: new URL('https://YOUR-VERCEL-DOMAIN.vercel.app')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="logo">
              <img src="/bbb-logo.png" alt="BBB" width={56} height={56} />
            </div>
            <h1>Find and Apply for a Job with a BBB Trusted Accredited Business</h1>
          </header>
          {children}
          <footer className="footer">
            © {new Date().getFullYear()} Better Business Bureau — Eastern MA, ME, RI & VT
          </footer>
        </div>
      </body>
    </html>
  );
}

// ---------- file: app/page.tsx ----------
'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Job } from '@/types';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search params state
  const [q, setQ] = useState('');
  const [business, setBusiness] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs', { cache: 'no-store' });
        const data = await res.json();
        setJobs(data.jobs as Job[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach(j => j.category && s.add(j.category));
    return Array.from(s).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter(j => {
      const matchesQ = !ql || [j.title, j.businessName, j.city, j.state, j.postalCode, j.category]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(ql));
      const matchesBusiness = !business || j.businessName.toLowerCase().includes(business.toLowerCase());
      const matchesTitle = !title || j.title.toLowerCase().includes(title.toLowerCase());
      const matchesCity = !city || (j.city || '').toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || (j.state || '').toLowerCase().includes(state.toLowerCase());
      const matchesZip = !zip || (j.postalCode || '').toLowerCase().includes(zip.toLowerCase());
      const matchesCategory = !category || (j.category === category);
      return matchesQ && matchesBusiness && matchesTitle && matchesCity && matchesState && matchesZip && matchesCategory;
    });
  }, [jobs, q, business, title, city, state, zip, category]);

  return (
    <main className="grid" style={{gap: '1.25rem'}}>
      <section className="card">
        <form className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem'}} onSubmit={e => e.preventDefault()}>
          <div>
            <div className="label">Search</div>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Business, title, city, state, zip" />
          </div>
          <div>
            <div className="label">Business Name</div>
            <input className="input" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="e.g., Acme Roofing" />
          </div>
          <div>
            <div className="label">Job Title</div>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Technician" />
          </div>
          <div>
            <div className="label">City</div>
            <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g., Boston" />
          </div>
          <div>
            <div className="label">State</div>
            <input className="input" value={state} onChange={e=>setState(e.target.value)} placeholder="e.g., MA" />
          </div>
          <div>
            <div className="label">Zip Code</div>
            <input className="input" value={zip} onChange={e=>setZip(e.target.value)} placeholder="e.g., 02108" />
          </div>
          <div>
            <div className="label">Job Category</div>
            <select value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </form>
      </section>

      <section className="grid" style={{gap: '0.75rem'}}>
        {loading && <div className="card">Loading jobs…</div>}
        {error && <div className="card">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="card">No jobs match your search yet. Try clearing filters.</div>
        )}
        <div className="jobs-grid">
          {filtered.map(job => (
            <article key={job.id} className="card">
              <div className="pill" title="BBB Member">BBB Accredited</div>
              <h3 style={{margin: '0.5rem 0 0.25rem 0'}}>{job.title}</h3>
              <div style={{color:'#2c5560', fontWeight:600}}>{job.businessName}</div>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'0.35rem 0'}}>
                {job.city || job.state || job.postalCode ? (
                  <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
                ) : null}
                {job.category && <span className="badge">{job.category}</span>}
                {job.employmentType && <span className="badge">{job.employmentType}</span>}
              </div>
              {job.description && <p style={{marginTop:6, color:'#20404a'}}>{job.description.slice(0, 160)}{job.description.length>160?'…':''}</p>}
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <a className="button" href={`/job/${job.id}`}>View Details</a>
                {job.applyUrl && <a className="button secondary" href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply</a>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

// ---------- file: app/job/[id]/page.tsx ----------
import type { Metadata } from 'next';
import { getJobById } from '@/lib/fetchJobs';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJobById(params.id);
  if (!job) return { title: 'Job not found — BBB Accredited' };
  return {
    title: `${job.title} at ${job.businessName} — BBB Accredited`,
    description: job.description?.slice(0, 160)
  };
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const job = await getJobById(params.id);
  if (!job) return <div className="card">Job not found.</div>;

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    'title': job.title,
    'description': job.description,
    'datePosted': job.datePosted,
    'validThrough': job.validThrough,
    'employmentType': job.employmentType,
    'hiringOrganization': {
      '@type': 'Organization',
      'name': job.businessName,
      'sameAs': job.businessUrl || undefined
    },
    'jobLocation': job.city || job.state || job.postalCode ? {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': job.streetAddress,
        'addressLocality': job.city,
        'addressRegion': job.state,
        'postalCode': job.postalCode,
        'addressCountry': 'US'
      }
    } : undefined,
    'baseSalary': job.baseSalary ? {
      '@type': 'MonetaryAmount',
      'currency': 'USD',
      'value': { '@type': 'QuantitativeValue', 'value': job.baseSalary }
    } : undefined,
    'applicantLocationRequirements': job.city || job.state ? {
      '@type': 'Country',
      'name': 'United States'
    } : undefined,
    'directApply': true,
    'applicationContact': job.email ? { '@type': 'ContactPoint', 'email': job.email } : undefined,
    'url': job.applyUrl || `https://YOUR-VERCEL-DOMAIN.vercel.app/job/${job.id}`
  };

  return (
    <main className="grid" style={{gap:'1rem'}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="card">
        <div className="pill">BBB Accredited</div>
        <h2 style={{margin:'0.5rem 0 0.25rem'}}>{job.title}</h2>
        <div style={{color:'#2c5560', fontWeight:600}}>{job.businessName}</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'0.35rem 0'}}>
          {(job.city || job.state || job.postalCode) && (
            <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
          )}
          {job.category && <span className="badge">{job.category}</span>}
          {job.employmentType && <span className="badge">{job.employmentType}</span>}
        </div>
        {job.description && <p style={{whiteSpace:'pre-wrap'}}>{job.description}</p>}
        <div style={{display:'flex', gap:10, marginTop:12}}>
          {job.applyUrl && <a className="button" href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply on Company Site</a>}
          <a className="button secondary" href="/">Back to Listings</a>
        </div>
      </article>
    </main>
  );
}

// ---------- file: app/api/jobs/route.ts ----------
import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/fetchJobs';

export const revalidate = 60; // ISR-like caching for API response (1 minute)

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load jobs' }, { status: 500 });
  }
}

// ---------- file: app/robots.ts ----------
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://YOUR-VERCEL-DOMAIN.vercel.app/sitemap.xml'
  };
}

// ---------- file: app/sitemap.ts ----------
import type { MetadataRoute } from 'next';
import { getJobs } from '@/lib/fetchJobs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getJobs();
  const base = 'https://YOUR-VERCEL-DOMAIN.vercel.app';
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'hourly', priority: 1 }
  ];
  for (const j of jobs) {
    items.push({ url: `${base}/job/${j.id}`, changeFrequency: 'daily', priority: 0.8, lastModified: j.datePosted ? new Date(j.datePosted) : undefined });
  }
  return items;
}

// ---------- file: .env.local.example ----------
# REQUIRED: point to your Google Sheet (publish as CSV OR supply a JSON endpoint).
# For Google Sheets CSV, use: https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv
SHEET_URL="https://REPLACE_WITH_YOUR_SHEET_OR_FEED_URL"
NEXT_PUBLIC_SHEET_URL="${SHEET_URL}"

// ---------- file: README.md ----------
# BBB Jobs App (Next.js 14 on Vercel)

An SEO-friendly job board for **BBB Accredited Businesses**, with **Google JobPosting** structured data and search/filtering.

## Quick Start
1. **Create the repo** (GitHub) named `bbb-`.
2. **Copy files** in this project structure.
3. Add your BBB logo image to `public/bbb-logo.png`.
4. In **Vercel Project Settings → Environment Variables**, set:
   - `SHEET_URL` (or `NEXT_PUBLIC_SHEET_URL`) to your feed. Supports **JSON** _or_ **CSV** (Google Sheets Publish to Web CSV works great).
5. `pnpm i` (or `npm i`), then `pnpm dev` to run locally.
6. Deploy to **Vercel**. Replace `YOUR-VERCEL-DOMAIN` in `layout.tsx`, `sitemap.ts`, and job JSON-LD `url` with your domain.

### Expected Columns (flexible)
The parser is tolerant; it looks for common names. Recommended headers:
- `Business Name`, `Business URL`
- `Job Title`, `Job Category`, `Employment Type`
- `City`, `State`, `Zip`, `Street`
- `Description`
- `Date Posted`, `Valid Through`
- `Salary`
- `Apply URL`, `Apply Email`

### Google Jobs Compatibility
Each job detail page embeds a `JobPosting` JSON-LD payload. Ensure each row has at least **Job Title**, **Business Name**, and either **Apply URL** or contact **Email**. Fill location fields to maximize eligibility.

### Sitemap & Robots
A dynamic `/sitemap.xml` lists all jobs for faster indexing; `/robots.txt` allows crawling. Vercel will serve both.

### Notes
- This app fetches the sheet on-demand (no database). Use Vercel Cron if you later want to prebuild pages.
- You can whitelist states to focus on **MA, ME, RI, VT** by filtering in `app/api/jobs/route.ts` if desired.

