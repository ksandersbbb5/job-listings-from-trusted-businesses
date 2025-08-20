// pages/index.jsx
import { useEffect, useState, useMemo } from 'react';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/jobs', { cache: 'no-store' });
        const data = await res.json();
        setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set();
    jobs.forEach(j => j.category && s.add(j.category));
    return Array.from(s).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter(j => {
      const hay = [j.title, j.businessName, j.city, j.state, j.postalCode, j.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQ = !ql || hay.includes(ql);
      const matchesCategory = !category || j.category === category;
      return matchesQ && matchesCategory;
    });
  }, [jobs, q, category]);

  return (
    <main className="container" style={{ fontFamily: 'system-ui' }}>
      <header className="header">
        <div className="logo"><img src="/bbb-logo.png" alt="BBB" width={56} height={56} /></div>
        <h1>Find and Apply for a Job with a BBB Trusted Accredited Business</h1>
      </header>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <input
          className="input"
          placeholder="Search business, title, city, state, zip"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <section className="jobs-grid">
        {filtered.map(job => (
          <article key={job.id} className="card">
            <div className="pill">BBB Accredited</div>
            <h3 style={{ margin: '8px 0 4px' }}>{job.title}</h3>
            <div style={{ color: '#2c5560', fontWeight: 600 }}>{job.businessName}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {(job.city || job.state || job.postalCode) && (
                <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
              )}
              {job.category && <span className="badge">{job.category}</span>}
              {job.employmentType && <span className="badge">{job.employmentType}</span>}
            </div>
            {job.description && <p style={{ marginTop: 8 }}>{job.description.slice(0, 140)}{job.description.length > 140 ? '…' : ''}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <a className="button" href={`/job/${job.id}`}>View Details</a>
              {job.applyUrl && <a className="button secondary" href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply</a>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
