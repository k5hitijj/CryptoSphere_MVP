import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="h-[75vh] flex flex-col justify-center items-center text-center px-4">
      <div className="w-20 h-20 bg-dark-border/50 border border-dark-border rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/25">
        <HelpCircle className="w-10 h-10 text-brand-400 animate-bounce" />
      </div>
      
      <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight mb-2">404</h2>
      <p className="text-slate-400 text-lg max-w-md mb-8">
        The page you are looking for does not exist or has been restricted to authorized administrators.
      </p>
      
      <Link to="/" className="btn-primary">
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
};
export default NotFound;
