// ---------- file: lib/fetchJobs.ts ----------
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
