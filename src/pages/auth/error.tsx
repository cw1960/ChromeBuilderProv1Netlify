import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

const ErrorPage = dynamic(() => import('@/components/auth/ErrorPage'), {
  ssr: false,
});

export default ErrorPage; 