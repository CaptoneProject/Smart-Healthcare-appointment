import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToasterProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '0.5rem',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToasterProvider;