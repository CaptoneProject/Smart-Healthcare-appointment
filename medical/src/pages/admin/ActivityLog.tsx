import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { adminService } from '../../services/api';
import { 
  Search, 
  Filter, 
  Download, 
  UserCheck, 
  Users, 
  Calendar, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await adminService.getAllActivities();
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
      activity.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
                        (typeFilter === 'doctor' && activity.type.includes('DOCTOR')) ||
                        (typeFilter === 'user' && activity.type.includes('USER')) ||
                        (typeFilter === 'appointment' && activity.type.includes('APPOINTMENT'));
    
    return matchesSearch && matchesType;
  });

  // Helper function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    if (type.includes('DOCTOR')) {
      return <UserCheck className={`w-5 h-5 ${type.includes('APPROVED') ? 'text-green-400' : 'text-red-400'}`} />;
    } else if (type.includes('USER')) {
      return <Users className="w-5 h-5 text-blue-400" />;
    } else if (type.includes('APPOINTMENT')) {
      return <Calendar className="w-5 h-5 text-yellow-400" />;
    }
    return <Activity className="w-5 h-5 text-blue-400" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Activity Log" 
        description="View all system activities and events"
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Activities</option>
              <option value="doctor">Doctor Approvals</option>
              <option value="user">User Activities</option>
              <option value="appointment">Appointments</option>
            </select>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-white/60">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <p>No activities found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="mr-4">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h4 className="text-sm font-medium text-white/90">{activity.type.replace(/_/g, ' ')}</h4>
                      <p className="text-white/80 mt-1">{activity.message}</p>
                    </div>
                    <span className="text-xs text-white/60 mt-2 md:mt-0">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4">
          <div className="text-sm text-white/60">
            Showing <span className="text-white/90">{filteredActivities.length}</span> of <span className="text-white/90">{activities.length}</span> activities
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">Previous</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white bg-white/10">1</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">2</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">3</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivityLog;