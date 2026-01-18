import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const CalendarPanel = () => {
  const currentMonth = "March";
  const trainingDays = [4, 5, 6, 11, 12, 15, 17, 18];
  const today = 15;
  
  const weekDays = ["Su", "M", "Tu", "W", "Th", "Fr", "Sa"];
  
  // Generate calendar days (simplified for March layout)
  const calendarDays = [
    [null, null, null, null, null, null, 1],
    [2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28, 29],
    [30, 31, null, null, null, null, null],
  ];

  const xpGained = 4;
  const sessionsCompleted = 12;

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-300">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-gothic text-lg text-primary">{currentMonth}</h3>
        <div className="flex gap-1">
          <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
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
              const isToday = day === today;
              
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
        {/* Premium Checkbox */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-primary bg-primary/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-foreground">Premium</span>
          </div>
          <span className="text-sm font-bold text-foreground">90:39</span>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Budget</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">REF</span>
            <span className="text-sm font-bold">605</span>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">E03</span>
              <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded">700</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP and Sessions */}
      <div className="mt-4 flex justify-center gap-8">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">XP</div>
          <div className="text-lg font-bold text-primary">{xpGained}%</div>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-xs text-primary">⚡</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Lvlns</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
