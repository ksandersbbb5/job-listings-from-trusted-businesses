// ---------- file: app/page.tsx ----------
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
</main>
);
}
