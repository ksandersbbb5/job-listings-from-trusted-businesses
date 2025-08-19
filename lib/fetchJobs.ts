// ---------- file: lib/fetchJobs.ts ----------
import Papa from 'papaparse';
import { Job } from '@/types';
import { slugify, toISO } from '@/lib/utils';


const SHEET_URL = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;


function normalizeKey(key: string) {
return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
