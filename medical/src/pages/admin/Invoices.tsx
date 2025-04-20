import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import InvoiceManagement from '../../components/InvoiceManagement';

const AdminInvoices: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Invoice Management" 
        description="Create, view, and manage all patient invoices"
      />
      
      <Card>
        <InvoiceManagement userType="admin" />
      </Card>
    </div>
  );
};

export default AdminInvoices;