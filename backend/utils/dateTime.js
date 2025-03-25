const formatDate = (date) => {
  if (!date) return 'unknown date';
  
  try {
    // If it's already a date string in ISO format, return it directly
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // Create a new date that handles timezone properly
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      // For string dates, parse and adjust for timezone
      const parsedDate = new Date(date);
      
      // Add the local timezone offset to ensure correct date
      const tzOffset = parsedDate.getTimezoneOffset() * 60000; // offset in milliseconds
      dateObj = new Date(parsedDate.getTime() + tzOffset);
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'invalid date';
    }
    
    // Format as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'unknown date';
  }
};

const formatTime = (time) => {
  return time.substring(0, 5);
};

const normalizeDate = (dateStr) => {
  return dateStr.split('T')[0];
};

const normalizeTime = (timeStr) => {
  return timeStr.substring(0, 5);
};

module.exports = {
  formatDate,
  formatTime,
  normalizeDate,
  normalizeTime
};