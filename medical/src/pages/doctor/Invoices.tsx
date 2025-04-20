import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import InvoiceManagement from '../../components/InvoiceManagement';
import { useAuth } from '../../context/AuthContext';

const DoctorInvoices: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Patient Invoices" 
        description="Create and manage invoices for your patients"
      />
      
      <Card>
        <InvoiceManagement userType="doctor" userId={user?.id} />
      </Card>
    </div>
  );
};

export default DoctorInvoices;