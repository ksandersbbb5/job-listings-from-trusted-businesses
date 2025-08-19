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
'directApply': Boolean(job.applyUrl),
'applicationContact': job.email ? { '@type': 'ContactPoint', 'email': job.email } : undefined,
'url': job.applyUrl || `https://YOUR-VERCEL-DOMAIN.vercel.app/job/${job.id}`
} as any;


return (
<main className="grid" style={{gap:'1rem'}}>
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
<article className="card">
<div className="pill">BBB Accredited</div>
}
