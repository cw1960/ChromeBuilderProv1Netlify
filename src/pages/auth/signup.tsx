import dynamic from 'next/dynamic';

const SignUpPage = dynamic(() => import('@/components/auth/SignUpPage'), {
  ssr: false,
});

export default SignUpPage; 