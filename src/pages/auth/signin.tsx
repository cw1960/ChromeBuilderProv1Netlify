import dynamic from 'next/dynamic';

const SignInPage = dynamic(() => import('@/components/auth/SignInPage'), {
  ssr: false,
});

export default SignInPage; 