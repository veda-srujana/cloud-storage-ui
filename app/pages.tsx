// page.tsx
import { Amplify } from 'aws-amplify';
import awsconfig from '../src/aws-exports';
import './globals.css';
import type { AppProps } from 'next/app';

Amplify.configure(awsconfig);

function Home({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default Home;
