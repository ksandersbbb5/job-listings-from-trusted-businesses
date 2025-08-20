import { useEffect, useMemo, useState } from 'react';

type Job = {
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
  datePosted?: string;
  validThrough?: string;
  employmentType?: string;
  baseSalary?: string;
  applyUrl?: string;
  email?: string;
};

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [business, setBusiness] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/jobs', { cache: 'no-store' });
        const data = await res.json();
        setJobs((data?.jobs as Job[]) || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach(j => j.category && s.add(j.category));
    return Array.from(s).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter(j => {
      const matchesQ =
        !ql ||
        [j.title, j.businessName, j.city, j.state, j.postalCode, j.category]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(ql));
      const matchesBusiness = !business || j.businessName.toLowerCase().includes(business.toLowerCase());
      const matchesTitle = !title || j.title.toLowerCase().includes(title.toLowerCase());
      const matchesCity = !city || (j.city || '').toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || (j.state || '').toLowerCase().includes(state.toLowerCase());
      const matchesZip = !zip || (j.postalCode || '').toLowerCase().includes(zip.toLowerCase());
      const matchesCategory = !category || j.category === category;
      return matchesQ && matchesBusiness && matchesTitle && matchesCity && matchesState && matchesZip && matchesCategory;
    });
  }, [jobs, q, business, title, city, state, zip, category]);

  return (
    <main className="grid" style={{ gap: '1.25rem' }}>
      <header className="header" style={{paddingTop:0}}>
        <div className="logo">
          <img src="/bbb-logo.png" alt="BBB" width={56} height={56} />
        </div>
        <h1>Find and Apply for a Job with a BBB Trusted Accredited Business</h1>
      </header>

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

      <footer className="footer">© {new Date().getFullYear()} Better Business Bureau — Eastern MA, ME, RI & VT</footer>
    </main>
  );
}
