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
