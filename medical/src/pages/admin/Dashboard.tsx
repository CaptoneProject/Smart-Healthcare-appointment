import React from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { 
  UserCheck, 
  Users, 
  Calendar, 
  Activity,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  change?: {
    value: string;
    positive: boolean;
  };
  linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title,
  value,
  icon: Icon,
  description,
  change,
  linkTo
}) => (
  <Card>
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-400/10 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="ml-3 text-sm font-medium text-white/60">{title}</h3>
        </div>
        <div className="mt-4 text-2xl font-semibold text-white/90">{value}</div>
        <p className="text-white/60 text-sm mt-1">{description}</p>
        
        {change && (
          <div className={`mt-2 text-sm ${change.positive ? 'text-green-400' : 'text-red-400'}`}>
            {change.positive ? '↑' : '↓'} {change.value} from last week
          </div>
        )}
      </div>
    </div>
    
    {linkTo && (
      <div className="mt-4 pt-4 border-t border-white/10">
        <Link 
          to={linkTo} 
          className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-all"
        >
          View details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    )}
  </Card>
);

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="System overview and management"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending Approvals" 
          value="5" 
          icon={UserCheck}
          description="Doctor credentials waiting for review"
          linkTo="/admin/doctor-approvals"
        />
        
        <StatCard 
          title="Total Users" 
          value="1,248" 
          icon={Users}
          description="Active users in the system"
          change={{ value: "12%", positive: true }}
          linkTo="/admin/users"
        />
        
        <StatCard 
          title="Appointments Today" 
          value="68" 
          icon={Calendar}
          description="Scheduled appointments today"
          change={{ value: "5%", positive: true }}
        />
        
        <StatCard 
          title="System Health" 
          value="98%" 
          icon={Activity}
          description="Overall system performance"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-white/90 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            <div className="flex items-start p-3 bg-white/5 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <p className="text-white/90">Dr. James Smith credentials approved</p>
                <p className="text-sm text-white/60">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-white/5 rounded-lg">
              <Users className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <p className="text-white/90">5 new patients registered</p>
                <p className="text-sm text-white/60">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-white/5 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
              <div>
                <p className="text-white/90">System maintenance scheduled</p>
                <p className="text-sm text-white/60">1 day ago</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link 
              to="/admin/activity-log" 
              className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-all"
            >
              View all activities
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-lg font-medium text-white/90 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-white/60">Server Load</span>
                <span className="text-white/90">42%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-white/60">Database Usage</span>
                <span className="text-white/90">68%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-white/60">API Response Time</span>
                <span className="text-white/90">120ms</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link 
              to="/admin/settings" 
              className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-all"
            >
              System settings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;