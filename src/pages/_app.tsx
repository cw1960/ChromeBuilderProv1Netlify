import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ProjectRefreshProvider } from '../contexts/ProjectRefreshContext';
import '../styles/globals.css';

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <ProjectRefreshProvider>
          <Component {...pageProps} />
        </ProjectRefreshProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

App.getInitialProps = async () => {
  return { pageProps: {} };
};

export default App;