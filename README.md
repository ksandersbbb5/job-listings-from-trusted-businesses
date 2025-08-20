// ---------- file: README.md ----------
An SEO-friendly job board for **BBB Accredited Businesses**, with **Google JobPosting** structured data and search/filtering.





## Quick Start
1. **Create the repo** (GitHub) named `bbb-`.
2. **Copy files** in this project structure.
3. Add your BBB logo image to `public/bbb-logo.png`.
4. In **Vercel Project Settings → Environment Variables**, set:
- `SHEET_URL` (or `NEXT_PUBLIC_SHEET_URL`) to your feed. Supports **JSON** _or_ **CSV** (Google Sheets Publish to Web CSV works great).
5. `npm i`, then `npm run dev` to run locally.
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


// ---------- file: public/bbb-logo.png ----------
(Binary image) — upload your BBB logo here. If you used the provided one, save it as `/public/bbb-logo.png`.


// ---------- file: public/README.txt ----------
Place your provided BBB logo at public/bbb-logo.png
(If you have the attached bluechatlogo.png already, save it here as bbb-logo.png)
// =============================================
// BBB Jobs App — Next.js 14 (App Router) + Vercel
// Each file is separated below with its destination PATH.
// Copy exactly into your repo with the same folders.
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
