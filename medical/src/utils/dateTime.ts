import { format } from 'date-fns';

export { format }; // Export format function for direct use

export const DATE_FORMATS = {
  DATABASE: 'yyyy-MM-dd',    // For storage
  TIME_24H: 'HH:mm',        // 24-hour time without seconds
  DISPLAY: {
    DATE: 'MMM d, yyyy',
    TIME: 'HH:mm',          // 24-hour time for consistency
    FULL: 'MMM d, yyyy HH:mm',
    WEEKDAY_FULL: 'EEEE, MMMM d, yyyy' // For full date display
  }
};

// Fix the formatDate function to avoid timezone issues
export const formatDate = (dateStr: string) => {
  // If the input is already in YYYY-MM-DD format, use createLocalDate
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = createLocalDate(dateStr);
    return format(date, DATE_FORMATS.DISPLAY.DATE);
  } 
  // For other formats, use the original implementation
  return format(new Date(dateStr), DATE_FORMATS.DISPLAY.DATE);
};

export const formatTime = (time: string) => {
  return time.substring(0, 5); // HH:mm format
};

export const formatFullDate = (date: string) => {
  // If the input is already in YYYY-MM-DD format, use createLocalDate
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const localDate = createLocalDate(date);
    return format(localDate, DATE_FORMATS.DISPLAY.WEEKDAY_FULL);
  }
  // For other formats, use the standard implementation but at noon
  const dateObj = new Date(date);
  dateObj.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  return format(dateObj, DATE_FORMATS.DISPLAY.WEEKDAY_FULL);
};

// Replace the createLocalDate function with this more robust version
export const createLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Use regex to handle different date formats
  const cleanDateStr = dateStr.split('T')[0]; // Remove any time component
  const [year, month, day] = cleanDateStr.split('-').map(num => parseInt(num, 10));
  
  // Create date at noon to avoid timezone issues
  return new Date(year, month - 1, day, 12, 0, 0);
};

// Update the normalizeDate function
export const normalizeDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};