// pages/job/[id].jsx
import Head from 'next/head';
import { getJobById } from '../../lib/fetchJobs.js';

export async function getServerSideProps(context) {
  const { id } = context.params;
  const job = await getJobById(id);
  if (!job) return { notFound: true };
  return { props: { job } };
}

export default function JobDetail({ job }) {
  const baseSalary =
    job.baseSalaryValue && job.baseSalaryUnitText
      ? {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: {
            '@type': 'QuantitativeValue',
            value: job.baseSalaryValue,
            unitText: job.baseSalaryUnitText
          }
        }
      : undefined;

  const jobLocation =
    job.city || job.state || job.postalCode || job.streetAddress
      ? {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            streetAddress: job.streetAddress,
            addressLocality: job.city,
            addressRegion: job.state,
            postalCode: job.postalCode,
            addressCountry: 'US'
          }
        }
      : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    jobLocationType: job.jobLocationType, // e.g., "Remote", "Hybrid", "Onsite"
    hiringOrganization: {
      '@type': 'Organization',
      name: job.businessName,
      sameAs: job.businessUrl || undefined,
      logo: job.logoUrl || undefined
    },
    jobLocation,
    baseSalary,
    directApply: Boolean(job.applyUrl),
    applicantLocationRequirements: undefined,
    url: job.applyUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/job/${job.id}`
  };

  return (
    <>
      <Head>
        <title>{`${job.title} at ${job.businessName} — BBB Accredited`}</title>
        <meta name="description" content={(job.description || '').slice(0, 160)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main className="container grid">
        <article className="card">
          <div className="row">
            {job.logoUrl && <img src={job.logoUrl} alt="" style={{width:56,height:56,objectFit:'contain'}} />}
            <div>
              <h2 style={{ margin: '0 0 6px' }}>{job.title}</h2>
              <div className="small" style={{ fontWeight: 700 }}>
                {job.businessUrl
                  ? <a href={job.businessUrl} target="_blank" rel="noopener noreferrer">{job.businessName}</a>
                  : job.businessName}
              </div>
              {(job.city || job.state || job.postalCode) && (
                <div className="row" style={{marginTop:6}}>
                  <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
                  {job.jobLocationType && <span className="badge">{job.jobLocationType}</span>}
                  {job.employmentType && <span className="badge">{job.employmentType}</span>}
                  {job.category && <span className="badge">{job.category}</span>}
                </div>
              )}
            </div>
          </div>

          {job.description && (
            <>
              <h3 style={{marginTop:16}}>Description</h3>
              <p style={{ whiteSpace:'pre-wrap' }}>{job.description}</p>
            </>
          )}

          {job.qualifications && (
            <>
              <h3>Qualifications</h3>
              <p style={{ whiteSpace:'pre-wrap' }}>{job.qualifications}</p>
            </>
          )}

          <div className="grid" style={{marginTop:8}}>
            {(job.baseCompensation || job.baseSalaryValue) && (
              <div className="small">
                <strong>Compensation:</strong>{' '}
                {job.baseCompensation || (job.baseSalaryValue && `$${job.baseSalaryValue}`)}{' '}
                {job.baseCompensationUnit ? `/${job.baseCompensationUnit}` : ''}{' '}
                {job.compensationType ? `· ${job.compensationType}` : ''}
              </div>
            )}
            {job.benefits && <div className="small"><strong>Benefits:</strong> {job.benefits}</div>}
            {job.workingHours && <div className="small"><strong>Working Hours:</strong> {job.workingHours}</div>}
            {job.education && <div className="small"><strong>Education:</strong> {job.education}</div>}
            {job.experienceMonths && <div className="small"><strong>Experience:</strong> {job.experienceMonths} months</div>}
            {job.datePosted && <div className="small"><strong>Date Posted:</strong> {new Date(job.datePosted).toLocaleDateString()}</div>}
            {job.validThrough && <div className="small"><strong>Posting Expires:</strong> {new Date(job.validThrough).toLocaleDateString()}</div>}
            {job.streetAddress && <div className="small"><strong>Address:</strong> {[
                job.streetAddress, job.city, job.state, job.postalCode
              ].filter(Boolean).join(', ')}</div>}
            {job.email && <div className="small"><strong>Contact Email:</strong> {job.email}</div>}
            {job.phone && <div className="small"><strong>Phone:</strong> {job.phone}</div>}
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            {job.applyUrl && (
              <a className="button" href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply on Company Site
              </a>
            )}
            <a className="button secondary" href="/">Back to Listings</a>
          </div>
        </article>
      </main>
    </>
  );
}
