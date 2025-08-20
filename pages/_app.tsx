import type { AppProps } from 'next/app';
import '../styles/globals.css'; // relative path (works without TS path aliases)

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
