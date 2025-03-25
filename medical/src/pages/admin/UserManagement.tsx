import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { adminService } from '../../services/api';
import { Search, Filter, Download, UserPlus, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

// First, define a User interface for proper typing
interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

const UserManagement: React.FC = () => {
  // Update state with proper typing
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminService.getUsers();
        
        // Sort users by ID in ascending order
        const sortedUsers = [...data].sort((a: User, b: User) => a.id - b.id);
        setUsers(sortedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update the filter function to use proper typing
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      await adminService.deleteUser(userToDelete.id);
      
      // Update local state to remove the deleted user
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="View and manage all users in the system"
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
              placeholder="Search users..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/60">ID</th>
                  <th className="text-left p-3 text-white/60">Name</th>
                  <th className="text-left p-3 text-white/60">Email</th>
                  <th className="text-left p-3 text-white/60">User Type</th>
                  <th className="text-left p-3 text-white/60">Created At</th>
                  <th className="text-left p-3 text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-white/60">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: User) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white/90">{user.id}</td>
                      <td className="p-3 text-white/90">{user.name}</td>
                      <td className="p-3 text-white/90">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.user_type === 'doctor' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : user.user_type === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-white/90">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <button className="text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10">
                            Edit
                          </button>
                          <button 
                            className="text-white/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10"
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4">
          <div className="text-sm text-white/60">
            Showing <span className="text-white/90">{filteredUsers.length}</span> of <span className="text-white/90">{users.length}</span> users
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

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          title="Confirm User Deletion"
        >
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white/90 mb-1">Warning: This action cannot be undone</h3>
                <p className="text-white/70 text-sm">
                  You are about to permanently delete the user <span className="font-medium">{userToDelete.name}</span>.
                  All associated data will be removed from the system.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <Button 
                variant="secondary"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              
              <Button 
                variant="danger"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;