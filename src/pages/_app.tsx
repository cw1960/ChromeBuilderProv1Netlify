import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Create a client-side only component for the app content
const AppContent = dynamic(() => Promise.resolve(({ Component, pageProps }: {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}) => {
  const { useState, useEffect } = require('react');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after a short delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;