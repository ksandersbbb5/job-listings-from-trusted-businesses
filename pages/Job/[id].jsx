import Head from 'next/head';
import { getJobById } from '../../lib/fetchJobs.js';

export async function getServerSideProps(context) {
  const { id } = context.params;
  const job = await getJobById(id);
  if (!job) return { notFound: true };
  return { props: { job } };
}

export default function JobDetail({ job }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.businessName,
      sameAs: job.businessUrl || undefined
    },
    jobLocation:
      job.city || job.state || job.postalCode
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
        : undefined,
    baseSalary: job.baseSalary
      ? {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: { '@type': 'QuantitativeValue', value: job.baseSalary }
        }
      : undefined,
    directApply: Boolean(job.applyUrl),
    applicationContact: job.email ? { '@type': 'ContactPoint', email: job.email } : undefined,
    url: job.applyUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/job/${job.id}`
  };

  return (
    <>
      <Head>
        <title>{`${job.title} at ${job.businessName} — BBB Accredited`}</title>
        <meta name="description" content={(job.description || '').slice(0, 160)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main className="container" style={{ display: 'grid', gap: 16 }}>
        <article className="card">
          <div className="pill">BBB Accredited</div>
          <h2 style={{ margin: '8px 0 4px' }}>{job.title}</h2>
          <div style={{ color: '#2c5560', fontWeight: 600 }}>{job.businessName}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0' }}>
            {(job.city || job.state || job.postalCode) && (
              <span className="badge">{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</span>
            )}
            {job.category && <span className="badge">{job.category}</span>}
            {job.employmentType && <span className="badge">{job.employmentType}</span>}
          </div>
          {job.description && <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
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
