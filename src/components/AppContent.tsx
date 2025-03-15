import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ProjectRefreshProvider } from '../contexts/ProjectRefreshContext';

interface AppContentProps {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}

export default function AppContent({ Component, pageProps }: AppContentProps) {
  const { session, ...otherProps } = pageProps;

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <ProjectRefreshProvider>
          <Component {...otherProps} />
        </ProjectRefreshProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 