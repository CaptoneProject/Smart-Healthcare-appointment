import React from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { UserX, Mail, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AccountRejected: React.FC = () => {
  const { logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <PageHeader 
          title="Account Rejected" 
          description="Your doctor account application has been rejected"
        />
        
        <Card className="p-8 mb-6">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <UserX className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white/90">Application Rejected</h2>
            <p className="text-white/60 max-w-lg">
              We're sorry, but your application to join SmartCare as a healthcare provider has been rejected.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Information Card */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10">
              <h3 className="text-lg font-medium text-white/90 mb-4">What You Can Do</h3>
              <div className="space-y-4">
                <p className="text-white/60">
                  If you believe there was an error or would like to discuss your application, 
                  please contact our administrator team:
                </p>
                
                <div className="flex items-center space-x-2 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <a 
                    href="mailto:admin@smartcare.com" 
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    admin@smartcare.com
                  </a>
                </div>
                
                <div className="text-white/60 text-sm">
                  <p className="mb-2">Please include the following in your email:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your full name and credentials</li>
                    <li>Registration email address</li>
                    <li>Any additional supporting documentation</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col items-center space-y-4 pt-4 border-t border-white/10">
              <Button
                variant="primary"
                size="lg"
                icon={<HelpCircle className="w-4 h-4" />}
                onClick={logout}
              >
                Sign Out
              </Button>
              <Link 
                to="/" 
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                Return to Home Page
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountRejected;