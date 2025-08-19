import './globals.css';

export const metadata = {
  title: 'Find and Apply for a Job with a BBB Trusted Accredited Business',
  description:
    'Search open roles from BBB Accredited Businesses and apply with confidence. Built for Google Job Listing compatibility.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="logo">
              <img src="/bbb-logo.png" alt="BBB" width={56} height={56} />
            </div>
            <h1>Find and Apply for a Job with a BBB Trusted Accredited Business</h1>
          </header>
          {children}
          <footer className="footer">
            © {new Date().getFullYear()} Better Business Bureau — Eastern MA, ME, RI & VT
          </footer>
        </div>
      </body>
    </html>
  );
}
