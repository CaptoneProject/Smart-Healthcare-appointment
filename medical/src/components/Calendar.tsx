// src/components/Calendar.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  type: string;
  status: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onDateClick,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get month name
  const getMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Helper: Parse a YYYY-MM-DD string and return a Date constructed in local time.
  const parseDateWithoutTimezone = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Update the hasEvents function to handle date comparison correctly

  // Update the getDateClass function with a more robust approach
  const getDateClass = (cellDateStr: string): string => {
    // Add debug logging to see what's happening with the dates
    console.log('Calendar comparing cell date:', cellDateStr);
    
    // Direct string comparison approach - no date objects that could cause timezone issues
    const eventsOnThisDay = events.filter(event => {
      console.log(`Calendar event date for comparison: ${event.date}, cell: ${cellDateStr}`);
      // Use exact string comparison without any date manipulation
      const isMatch = event.date === cellDateStr && event.status === 'confirmed';
      if (isMatch) console.log('MATCH FOUND!');
      return isMatch;
    });
    
    // Check if today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = todayStr === cellDateStr;
    
    // First check if it's both today and has an event
    if (isToday && eventsOnThisDay.length > 0) {
      return 'bg-purple-500/20 border-purple-500 font-bold'; // Special case: today with appointment
    }
    
    // Then check if it just has events
    if (eventsOnThisDay.length > 0) {
      return 'bg-blue-500/20 border-blue-500'; // Appointment date
    }
    
    // Then if it's just today
    if (isToday) {
      return 'relative ring-2 ring-white/50 font-bold'; // Today's date with ring and bold text
    }
    
    return ''; // No special styling for regular dates
  };

  // Check if date is today

  // Generate calendar days
  const renderCalendarDays = (): React.ReactElement[] => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);

    // Add borders to the empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 p-1 border border-white/10 rounded" />
      );
    }

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based
    const cells = [];

    // Add borders to the day cells
    for (let day = 1; day <= daysInMonth; day++) {
      // Construct a string in YYYY-MM-DD format
      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Include border-white/10 as a default border that will be overridden by getDateClass if needed
      cells.push(
        <div
          key={`day-${day}`}
          className={`h-12 p-1 rounded cursor-pointer flex items-center justify-center border border-white/10 ${getDateClass(cellDateStr)}`}
          onClick={() => onDateClick && onDateClick(parseDateWithoutTimezone(cellDateStr))}
        >
          {day}
        </div>
      );
    }

    return cells;
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white/90">Calendar</h2>
        <div className="flex items-center gap-2">
          <button 
            className="p-1 text-white/60 hover:text-white/90 transition-colors"
            onClick={prevMonth}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white/80">
            {getMonthName(currentDate)} {currentDate.getFullYear()}
          </span>
          <button 
            className="p-1 text-white/60 hover:text-white/90 transition-colors"
            onClick={nextMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-white/60 text-xs py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </Card>
  );
};

export default Calendar;