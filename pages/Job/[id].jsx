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
            unitText: job.baseSalaryUnitText.toUpperCase() // Google prefers uppercase units
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

  // Convert employment type to Google's expected format
  const normalizeEmploymentType = (type) => {
    if (!type) return 'FULL_TIME';
    const normalized = type.toString().toUpperCase().replace(/[-\s]/g, '_');
    // Map common variations to Google's expected values
    const typeMap = {
      'FULL_TIME': 'FULL_TIME',
      'FULLTIME': 'FULL_TIME',
      'PART_TIME': 'PART_TIME',
      'PARTTIME': 'PART_TIME',
      'CONTRACT': 'CONTRACTOR',
      'CONTRACTOR': 'CONTRACTOR',
      'TEMPORARY': 'TEMPORARY',
      'TEMP': 'TEMPORARY',
      'INTERN': 'INTERN',
      'INTERNSHIP': 'INTERN',
      'VOLUNTEER': 'VOLUNTEER',
      'PER_DIEM': 'PER_DIEM'
    };
    return typeMap[normalized] || 'FULL_TIME';
  };

  // Ensure required fields have fallback values
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title || 'Job Opening',
    description: job.description || job.qualifications || 'Join our team at this exciting opportunity.',
    datePosted: job.datePosted || new Date().toISOString(),
    validThrough: job.validThrough,
    employmentType: normalizeEmploymentType(job.employmentType),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.businessName || 'BBB Accredited Business',
      sameAs: job.businessUrl,
      logo: job.logoUrl
    },
    jobLocation,
    baseSalary,
    // Add identifier for better tracking
    identifier: {
      '@type': 'PropertyValue',
      name: job.businessName || 'BBB Accredited Business',
      value: job.id
    },
    // Add qualifications if available
    ...(job.qualifications && { qualifications: job.qualifications }),
    // Add job benefits if available
    ...(job.benefits && { jobBenefits: job.benefits }),
    // Add working hours if available
    ...(job.workingHours && { workHours: job.workingHours }),
    // Add education requirements if available
    ...(job.education && { educationRequirements: job.education }),
    // Add experience requirements if available
    ...(job.experienceMonths && {
      experienceRequirements: {
        '@type': 'OccupationalExperienceRequirements',
        monthsOfExperience: parseInt(job.experienceMonths)
      }
    }),
    // Handle remote work properly
    ...(job.jobLocationType && job.jobLocationType.toLowerCase().includes('remote') && {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'US'
      }
    }),
    // Add application URL
    url: job.applyUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://job-listings-from-trusted-businesses-git-main-bbb-boston.vercel.app'}/job/${job.id}`,
    // Add direct apply flag
    directApply: Boolean(job.applyUrl),
    // Add job category if available
    ...(job.category && { occupationalCategory: job.category }),
    // Add contact information if available
    ...(job.email && {
      applicationContact: {
        '@type': 'ContactPoint',
        email: job.email,
        ...(job.phone && { telephone: job.phone }),
        ...(job.contactName && { name: job.contactName })
      }
    })
  };

  // Remove undefined values to clean up the JSON-LD
  const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd, (key, value) => {
    return value === undefined ? undefined : value;
  }));

  return (
    <>
      <Head>
        <title>{`${job.title} at ${job.businessName} — BBB Accredited`}</title>
        <meta name="description" content={(job.description || job.qualifications || '').slice(0, 160)} />
        <meta property="og:title" content={`${job.title} at ${job.businessName}`} />
        <meta property="og:description" content={(job.description || job.qualifications || '').slice(0, 160)} />
        <meta property="og:type" content="website" />
        {job.logoUrl && <meta property="og:image" content={job.logoUrl} />}
        
        {/* JSON-LD Structured Data for Google Jobs */}
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(cleanJsonLd, null, 2) 
          }} 
        />
      </Head>

      <main className="container grid">
        <article className="card">
          <div className="row">
            {job.logoUrl && <img src={job.logoUrl} alt={`${job.businessName} logo`} style={{width:56,height:56,objectFit:'contain'}} />}
            <div>
              <h1 style={{ margin: '0 0 6px' }}>{job.title}</h1>
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
              <h2 style={{marginTop:16}}>Description</h2>
              <p style={{ whiteSpace:'pre-wrap' }}>{job.description}</p>
            </>
          )}

          {job.qualifications && (
            <>
              <h2>Qualifications</h2>
              <p style={{ whiteSpace:'pre-wrap' }}>{job.qualifications}</p>
            </>
          )}

          <div className="grid" style={{marginTop:8}}>
            {(job.baseCompensation || job.baseSalaryValue) && (
              <div className="small">
                <strong>Compensation:</strong>{' '}
                {job.baseCompensation || (job.baseSalaryValue && `$${job.baseSalaryValue.toLocaleString()}`)}{' '}
                {job.baseCompensationUnit ? `/${job.baseCompensationUnit}` : job.baseSalaryUnitText ? `/${job.baseSalaryUnitText}` : ''}{' '}
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
            {job.contactName && <div className="small"><strong>Contact:</strong> {job.contactName} {job.contactTitle ? `(${job.contactTitle})` : ''}</div>}
            {job.email && <div className="small"><strong>Contact Email:</strong> <a href={`mailto:${job.email}`}>{job.email}</a></div>}
            {job.phone && <div className="small"><strong>Phone:</strong> <a href={`tel:${job.phone}`}>{job.phone}</a></div>}
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
