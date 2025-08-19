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
