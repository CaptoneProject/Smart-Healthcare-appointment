// src/components/Calendar.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  type: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateClick,
  onEventClick,
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

  // Check if a date has events
  const hasEvents = (day: number): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Generate calendar days
  const renderCalendarDays = (): JSX.Element[] => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 p-1" />
      );
    }

    // Add calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = hasEvents(day);
      const dayHasEvents = dayEvents.length > 0;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-12 p-1 relative rounded hover:bg-white/5 transition-colors cursor-pointer ${
            isToday(day) ? 'bg-blue-500/10 border border-blue-500/30' : ''
          }`}
          onClick={() => {
            if (onDateClick) {
              const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              onDateClick(clickedDate);
            }
          }}
        >
          <span className={`block w-7 h-7 flex items-center justify-center rounded-full
            ${isToday(day) ? 'bg-blue-500 text-white' : 'text-white/80'}`}>
            {day}
          </span>
          
          {dayHasEvents && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center">
              {dayEvents.length > 2 ? (
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mx-0.5" />
              ) : (
                dayEvents.map((event, i) => (
                  <span 
                    key={`event-${event.id}`}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full mx-0.5"
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEventClick) onEventClick(event);
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
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