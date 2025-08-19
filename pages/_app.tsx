import type { AppProps } from 'next/app';
import '../app/globals.css'; // reuse the same stylesheet
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
