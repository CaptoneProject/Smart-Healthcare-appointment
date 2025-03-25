import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { 
  UserCheck, 
  Users, 
  Calendar, 
  Activity,
  ArrowRight,
  LucideIcon,
  AlertTriangle,
  UserMinus  // Add this import
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';

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
  isLoading?: boolean;
  onClick?: () => void;
}

// Update the StatCard component to have a minimum height
const StatCard: React.FC<StatCardProps> = ({ 
  title,
  value,
  icon: Icon,
  description,
  change,
  linkTo,
  isLoading,
  onClick
}) => (
  <div 
    className={onClick ? "cursor-pointer" : ""}
    onClick={onClick}
  >
    <Card className="h-full">
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-400/10 backdrop-blur-sm">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="ml-3 text-sm font-medium text-white/60">{title}</h3>
          </div>
          <div className="mt-4 text-2xl font-semibold text-white/90">
            {isLoading ? (
              <div className="h-8 w-16 bg-white/10 animate-pulse rounded"></div>
            ) : (
              value
            )}
          </div>
          <p className="text-white/60 text-sm mt-1">{description}</p>
          
          {/* Simplified change display */}
          {change && (
            <div className={`mt-2 text-sm ${change.positive ? 'text-green-400' : 'text-red-400'}`}>
              {change.value}
            </div>
          )}
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
      </div>
    </Card>
  </div>
);

// Add interfaces for the activity data
interface ActivityItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  icon: LucideIcon;
  iconColor: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalUsers: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const handleNavigateToUsers = () => {
    navigate('/admin/users');
  };
  
  const handleNavigateToAppointments = () => {
    navigate('/admin/appointments');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setActivityLoading(true);
        
        // Fetch dashboard statistics
        const statsData = await adminService.getDashboardStats();
        setStats({
          pendingApprovals: statsData.pendingApprovals || 0,
          totalUsers: statsData.users?.total || 0,
          todayAppointments: statsData.todayAppointments || 0
        });
        
        // Fetch recent system activities
        try {
          const activityData = await adminService.getRecentActivities();
          
          // Convert to our ActivityItem format with appropriate icons
          const formattedActivities = activityData.map((activity: any) => {
            let icon = Activity;
            let iconColor = "text-blue-400";
            
            // Assign icons based on activity type
            if (activity.type.includes("DOCTOR_APPROVED")) {
              icon = UserCheck;
              iconColor = "text-green-400";
            } else if (activity.type.includes("DOCTOR_REJECTED")) {
              icon = UserCheck;
              iconColor = "text-red-400";
            } else if (activity.type.includes("USER_REGISTERED")) {
              icon = Users;
              iconColor = "text-blue-400";
            } else if (activity.type.includes("USER_DELETED")) {
              icon = UserMinus;  // Use UserMinus icon for deletions
              iconColor = "text-red-500";  // Use a brighter red for emphasis
            } else if (activity.type.includes("APPOINTMENT")) {
              icon = Calendar;
              iconColor = "text-yellow-400";
            }
            
            return {
              id: activity.id,
              type: activity.type,
              message: activity.message || activity.description,
              timestamp: formatTimeAgo(new Date(activity.created_at)),
              icon,
              iconColor
            };
          });
          
          setActivities(formattedActivities);
        } catch (activityErr) {
          console.error('Error fetching activities:', activityErr);
          // Fall back to empty activities but don't show an error
          setActivities([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
        setActivityLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format timestamps
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="System overview and management"
      />
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={UserCheck}
          description="Doctor credentials waiting for review"
          linkTo="/admin/doctor-approvals"
          isLoading={loading}
        />
        
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users}
          description="Active users in the system"
          change={{ value: "", positive: true }}
          onClick={handleNavigateToUsers}
          isLoading={loading}
        />
        
        <StatCard 
          title="Appointments Today" 
          value={stats.todayAppointments} 
          icon={Calendar}
          description="Scheduled appointments today"
          onClick={handleNavigateToAppointments}
          isLoading={loading}
        />
      </div>
      
      {/* Just a single Card for Recent Activities */}
      <Card className="w-full">
        <h3 className="text-lg font-medium text-white/90 mb-4">Recent Activities</h3>
        
        {activityLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-white/60">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <p>No recent activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start p-3 bg-white/5 rounded-lg">
                <activity.icon className={`w-5 h-5 ${activity.iconColor} mr-3 mt-0.5`} />
                <div>
                  <p className="text-white/90">{activity.message}</p>
                  <p className="text-sm text-white/60">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
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
    </div>
  );
};

export default AdminDashboard;