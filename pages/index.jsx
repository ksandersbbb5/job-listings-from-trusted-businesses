// pages/index.jsx
import { useEffect, useMemo, useState } from 'react';

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
      const hay = [
        j.title, j.businessName, j.category, j.city, j.state, j.postalCode,
        j.employmentType, j.jobLocationType
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQ = !ql || hay.includes(ql);
      const matchesCategory = !category || j.category === category;
      return matchesQ && matchesCategory;
    });
  }, [jobs, q, category]);

  return (
    <main className="container">
      <header className="header">
        <div className="logo">
          <img src="/bbb-logo.png" alt="BBB" />
        </div>
        <h1>Find and Apply for a Job with a BBB Trusted Accredited Business</h1>
      </header>

      {/* Hero image above search */}
      <div className="hero-wrap">
        <img src="/FindAJob.jpg" alt="Find a job" className="hero" />
      </div>

      {/* Search + Filters */}
      <section className="card grid">
        <input
          className="input"
          placeholder="Search by Business, Job Title, City, State, Zip"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      {/* Job cards */}
      <section className="jobs-grid">
        {filtered.map(job => (
          <article key={job.id} className="card">
            <div className="row">
              {job.logoUrl && (
                <img src={job.logoUrl} alt="" style={{width: 44, height: 44, objectFit:'contain'}} />
              )}
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{job.title}</h3>
                <div className="small" style={{ fontWeight: 700 }}>
                  {job.businessUrl
                    ? <a href={job.businessUrl} target="_blank" rel="noopener noreferrer">{job.businessName}</a>
                    : job.businessName}
                </div>
              </div>
            </div>

            <div className="meta">
              {(job.city || job.state || job.postalCode) && (
                <div className="row">
                  <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
                  {job.jobLocationType && <span className="badge">{job.jobLocationType}</span>}
                </div>
              )}
              {job.category && <div className="row"><span className="badge">{job.category}</span></div>}
              {job.employmentType && <div className="row"><span className="badge">{job.employmentType}</span></div>}
              {(job.baseCompensation || job.baseSalaryValue) && (
                <div className="small">
                  Compensation: {job.baseCompensation || (job.baseSalaryValue && `$${job.baseSalaryValue}`)} {job.baseCompensationUnit ? `/${job.baseCompensationUnit}` : ''}
                  {job.compensationType ? ` · ${job.compensationType}` : ''}
                </div>
              )}
              {job.benefits && <div className="small">Benefits: {job.benefits}</div>}
              {job.workingHours && <div className="small">Hours: {job.workingHours}</div>}
              {job.datePosted && <div className="small">Posted: {new Date(job.datePosted).toLocaleDateString()}</div>}
              {job.validThrough && <div className="small">Expires: {new Date(job.validThrough).toLocaleDateString()}</div>}
            </div>

            {job.description && (
              <p style={{ marginTop: 8 }}>
                {job.description.length > 220 ? job.description.slice(0, 220) + '…' : job.description}
              </p>
            )}

            <div className="row" style={{ marginTop: 10 }}>
              <a className="button" href={`/job/${job.id}`}>View Details</a>
              {job.applyUrl && (
                <a className="button secondary" href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply</a>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
