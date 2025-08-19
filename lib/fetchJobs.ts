import Papa from 'papaparse';
import type { Job } from '../types';           // <-- relative import to the root types.ts
import { slugify, toISO } from './utils';      // <-- relative import inside lib/

const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
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

function firstDefined<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v as T;
  }
  return undefined;
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
      normalized.business_name, normalized.company, normalized.employer_
