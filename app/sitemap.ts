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
