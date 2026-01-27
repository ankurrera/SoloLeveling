import { Check } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HabitCardProps {
  habit: Habit;
  onToggleCompletion: (habitId: string, date: string) => void;
}

const HabitCard = ({ habit, onToggleCompletion }: HabitCardProps) => {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<Set<string>>(new Set());

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // Color mapping - Neutral Grayscale
  const colorMap = {
    purple: "bg-muted border-border hover:bg-accent",
    green: "bg-muted border-border hover:bg-accent",
    gold: "bg-muted border-border hover:bg-accent",
    orange: "bg-muted border-border hover:bg-accent",
    brown: "bg-muted border-border hover:bg-accent",
  };

  const glowColorMap = {
    purple: "",
    green: "",
    gold: "",
    orange: "",
    brown: "",
  };

  // Generate 7x5 grid for the current month (35 days)
  const generateCalendarGrid = () => {
    const today = new Date();
    const grid: Date[][] = [];
    
    // Start from 34 days ago (to make 35 days total including today)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 34);
    const baseTime = startDate.getTime();

    for (let week = 0; week < 5; week++) {
      const weekDates: Date[] = [];
      for (let day = 0; day < 7; day++) {
        const dayOffset = (week * 7) + day;
        const date = new Date(baseTime + dayOffset * 24 * 60 * 60 * 1000);
        weekDates.push(date);
      }
      grid.push(weekDates);
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  // Calculate start date for queries (helper function)
  const getStartDate = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 34);
    return startDate.toISOString().split('T')[0];
  };

  // Load completions from database
  useEffect(() => {
    const loadCompletions = async () => {
      if (!user) return;

      const startDateStr = getStartDate();

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completion_date')
        .eq('habit_id', habit.id)
        .eq('user_id', user.id)
        .gte('completion_date', startDateStr);

      if (error) {
        console.error('Failed to load completions:', error);
        return;
      }

      if (data) {
        const completionDates = new Set(data.map(c => c.completion_date));
        setCompletions(completionDates);
      }
    };

    loadCompletions();
  }, [habit.id, user]);

  const handleToggle = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    onToggleCompletion(habit.id, dateStr);
    
    // Optimistic update
    setCompletions(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const isCompleted = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return completions.has(dateStr);
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div className="system-panel p-4 hover-glow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{habit.icon}</span>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {habit.name}
        </h3>
      </div>

      {/* Calendar Grid with Day Labels on Right */}
      <div className="flex gap-2">
        {/* 7x5 Grid */}
        <div className="flex-1 space-y-1">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((date, dayIndex) => {
                const completed = isCompleted(date);
                const future = isFutureDate(date);
                
                return (
                  <button
                    key={dayIndex}
                    onClick={() => !future && handleToggle(date)}
                    disabled={future}
                    className={`
                      w-6 h-6 rounded-sm border flex items-center justify-center
                      transition-all
                      ${future ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                      ${completed 
                        ? `${colorMap[habit.color]} ${glowColorMap[habit.color]} shadow-sm` 
                        : 'border-border/30 hover:border-border/50'
                      }
                    `}
                  >
                    {completed && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Day Labels */}
        <div className="flex flex-col justify-between py-0.5">
          {weekDays.map((day, index) => (
            <div key={index} className="text-[10px] text-muted-foreground h-6 flex items-center">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <Check className="w-2 h-2 text-green-500" />
        </div>
        <span className="text-muted-foreground">Done</span>
      </div>
    </div>
  );
};

export default HabitCard;
