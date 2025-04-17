import React from 'react';
import { CreditCard, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatFullDate, formatTime } from '../utils/dateTime';

interface PaymentReminderProps {
  appointmentId?: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  amount: number;
  invoiceId: number;
}

const PaymentReminder: React.FC<PaymentReminderProps> = ({ 
  appointmentId, 
  doctorName, 
  appointmentDate, 
  appointmentTime,
  amount,
  invoiceId
}) => {
  return (
    <div 
      className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4"
      data-appointment-id={appointmentId}
    >
      <div className="flex items-start">
        <div className="p-2 bg-blue-500/20 rounded-full mr-3">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium mb-1 text-white/90">Payment Required</h3>
          <p className="text-sm text-white/70 mb-3">
            Your appointment with Dr. {doctorName} on {formatFullDate(appointmentDate)} at {formatTime(appointmentTime)} has been confirmed. 
            Please complete the payment of ${parseFloat(amount.toString()).toFixed(2)} to finalize your booking.
          </p>
          <Link 
            to={`/p/payments?invoice=${invoiceId}`}
            className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentReminder;