import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useStats } from "@/hooks/useStats";

const CalendarPanel = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainingDays, setTrainingDays] = useState<number[]>([]);
  const { sessions, calculateStats } = useWorkoutSessions();
  const { getTrainingCalendar } = useStats();

  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const today = new Date().getDate();
  const isCurrentMonth = 
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  // Load training days for current month
  useEffect(() => {
    const loadTrainingDays = async () => {
      try {
        const calendar = await getTrainingCalendar(currentYear, currentDate.getMonth() + 1);
        const days = calendar.map(d => d.day_of_month);
        setTrainingDays(days);
      } catch (error) {
        console.error('Failed to load training calendar:', error);
        setTrainingDays([]); // Set empty array on error
      }
    };
    loadTrainingDays();
  }, [currentDate, getTrainingCalendar, currentYear]);

  const weekDays = ["Su", "M", "Tu", "W", "Th", "Fr", "Sa"];
  
  // Generate calendar days for the current month
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  // Fill in empty days before the first day
  for (let i = 0; i < firstDayWeekday; i++) {
    currentWeek.push(null);
  }
  
  // Fill in the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      calendarDays.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill remaining days in the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    calendarDays.push(currentWeek);
  }

  const stats = calculateStats(sessions);
  const sessionsThisMonth = sessions.filter(s => {
    const sessionDate = new Date(s.session_date);
    return sessionDate.getMonth() === currentDate.getMonth() &&
           sessionDate.getFullYear() === currentYear;
  }).length;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-300">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-gothic text-lg text-primary uppercase tracking-wider">{currentMonth} {currentYear}</h3>
        <div className="flex gap-1">
          <button 
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {calendarDays.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isTrainingDay = day && trainingDays.includes(day);
              const isToday = day === today && isCurrentMonth;
              
              return (
                <button
                  key={dayIndex}
                  disabled={!day}
                  className={`
                    relative h-8 w-full text-xs rounded transition-all
                    ${!day ? 'invisible' : ''}
                    ${isTrainingDay 
                      ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30' 
                      : 'text-muted-foreground hover:bg-muted/50'
                    }
                    ${isToday ? 'ring-1 ring-accent ring-offset-1 ring-offset-background' : ''}
                  `}
                >
                  {day}
                  {isTrainingDay && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Stats */}
      <div className="mt-4 pt-4 border-t border-border/30">
        {/* Training Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-primary bg-primary/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-foreground">Active Training</span>
          </div>
          <span className="text-sm font-bold text-foreground">{stats.consistency.toFixed(0)}%</span>
        </div>

        {/* Sessions this month */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Sessions</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{sessionsThisMonth}</span>
          </div>
        </div>
      </div>

      {/* XP and Total Sessions */}
      <div className="mt-4 flex justify-center gap-8">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-[0.1em]">Total XP</div>
          <div className="text-lg font-bold text-primary">{stats.totalXP}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-[0.1em]">All Time</div>
          <div className="text-lg font-bold text-foreground">{stats.totalSessions}</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
