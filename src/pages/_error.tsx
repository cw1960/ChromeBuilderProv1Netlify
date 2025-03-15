import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Head>
        <title>Error {statusCode ? `${statusCode}` : ''} | Chrome Builder</title>
      </Head>
      
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          {statusCode ? `${statusCode}` : 'Error'}
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          {statusCode
            ? `An error ${statusCode} occurred on the server`
            : 'An error occurred on the client'}
        </p>
        <a href="/" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
          Go back home
        </a>
      </div>
    </div>
  );
};

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default Error; 