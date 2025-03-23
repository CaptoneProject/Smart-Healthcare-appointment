import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const PendingApproval: React.FC = () => {
  const { logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-8">
      <Card className="w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="bg-yellow-500/20 p-4 inline-block rounded-full mb-4">
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Credentials Under Review</h1>
            <p className="text-white/60">
              Your medical credentials are currently being reviewed by our administrators. 
              This process typically takes 1-2 business days.
            </p>
          </div>
        
          <div className="space-y-4 mb-6">
            <div className="flex items-start p-4 bg-white/5 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white/90 mb-1">Credentials Submitted</h3>
                <p className="text-white/60 text-sm">
                  Your medical credentials have been successfully submitted for verification.
                </p>
              </div>
            </div>
          
            <div className="flex items-start p-4 bg-white/5 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white/90 mb-1">Verification In Progress</h3>
                <p className="text-white/60 text-sm">
                  Our team is currently reviewing your credentials and license information.
                </p>
              </div>
            </div>
          
            <div className="flex items-start p-4 bg-white/5 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white/90 mb-1">Next Steps</h3>
                <p className="text-white/60 text-sm">
                  You'll receive an email notification once your account is approved. You can then log in and access the doctor dashboard.
                </p>
              </div>
            </div>
          </div>
        
          <div className="border-t border-white/10 pt-6">
            <Button 
              variant="secondary" 
              size="md" 
              onClick={logout}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PendingApproval;