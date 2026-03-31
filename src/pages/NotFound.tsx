import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-xl text-slate-600 mt-4 mb-8">Page not found</p>
        <Link 
          to="/" 
          className="bg-slate-900 text-white px-6 py-3 rounded-md font-medium hover:bg-slate-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};
