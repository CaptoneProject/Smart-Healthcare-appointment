// src/components/Calendar.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { normalizeDate, format } from '../utils/dateTime';

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

  // Get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Simplified formatCalendarDate function using normalizeDate
  const formatCalendarDate = (year: number, month: number, day: number): string => {
    const localDate = new Date(year, month, day);
    return normalizeDate(localDate);
  };

  // Update the getDateClass function to handle completed appointments
  const getDateClass = (cellDateStr: string): string => {
    // Get all events for this day
    const eventsOnThisDay = events.filter(event => {
      const eventDate = event.date.split('T')[0];
      return eventDate === cellDateStr;
    });
    
    // Check for different event types
    const hasConfirmed = eventsOnThisDay.some(event => event.status.toLowerCase() === 'confirmed');
    const hasCompleted = eventsOnThisDay.some(event => event.status.toLowerCase() === 'completed');
    
    // Get today's date
    const today = new Date();
    const todayStr = normalizeDate(today);
    const isToday = todayStr === cellDateStr;
    
    // Apply classes based on priority (completed takes precedence over confirmed)
    if (isToday && hasCompleted) {
      return 'bg-green-500/20 border-green-500 font-bold';
    }
    
    if (hasCompleted) {
      return 'bg-green-500/20 border-green-500';
    }
    
    if (isToday && hasConfirmed) {
      return 'bg-purple-500/20 border-purple-500 font-bold';
    }
    
    if (hasConfirmed) {
      return 'bg-blue-500/20 border-blue-500';
    }
    
    if (isToday) {
      return 'relative ring-2 ring-white/50 font-bold';
    }
    
    return '';
  };

  // Update renderCalendarDays to use the new formatting
  const renderCalendarDays = (): React.ReactElement[] => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 p-1 border border-white/10 rounded" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDateStr = formatCalendarDate(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      
      days.push(
        <div
          key={`day-${day}`}
          className={`h-12 p-1 rounded cursor-pointer flex items-center justify-center border border-white/10 ${getDateClass(cellDateStr)}`}
          onClick={() => onDateClick && onDateClick(new Date(cellDateStr))}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Update the month/year display format
  const getDisplayDate = () => {
    return format(currentDate, 'MMMM yyyy');
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
            {getDisplayDate()}
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