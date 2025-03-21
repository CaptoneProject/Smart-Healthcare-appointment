import React from 'react';

export type StatusType = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Active' | 'Expired' | 'Refill Requested' | 'Overdue' | 'Paid';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'refill requested':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'paid':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)} ${className}`}>
      {status}
    </div>
  );
};