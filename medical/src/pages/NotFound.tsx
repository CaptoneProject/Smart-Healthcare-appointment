import React from 'react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-8 max-w-md w-full mx-auto backdrop-blur-xl bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl">
        {/* Alert icon container with proper positioning */}
        <div className="flex justify-center -mt-16 mb-4">
          <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30 shadow-lg shadow-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">404</h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white/90">Page Not Found</h2>
            <p className="text-white/60 max-w-sm mx-auto">
              Sorry, we couldn't find the page you're looking for. The page might have been removed or doesn't exist.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <Button 
            variant="primary"
            size="lg"
            icon={<Home className="w-5 h-5 mr-2" />}
            onClick={() => navigate('/')}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;