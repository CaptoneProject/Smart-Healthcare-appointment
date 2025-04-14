// src/utils/formatting.js

// Format a number as currency (USD by default)
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
    // Make sure we have a valid number
    const numValue = Number(value || 0);
    if (isNaN(numValue)) return '$0.00';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(numValue);
  };
  
  // Format a date string or Date object
  export const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Format time string
  export const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, parse it
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    }
    
    return timeString;
  };