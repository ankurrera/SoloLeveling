import { Target } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";

const GoalPanel = () => {
  const { goals } = useProfile();
  const { sessions } = useWorkoutSessions();

  // Calculate week progress from recent sessions
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  
  const recentSessions = sessions.filter(s => new Date(s.session_date) > weekAgo);
  
  // Create a Set of session date strings for O(1) lookup
  const sessionDateSet = new Set(
    recentSessions.map(s => new Date(s.session_date).toDateString())
  );
  
  // Map to week days (0 = Sunday) - now O(7) instead of O(n*7)
  const weekProgress = [0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
    const date = new Date(weekAgo);
    date.setDate(weekAgo.getDate() + dayOffset);
    return sessionDateSet.has(date.toDateString());
  });

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // Get last 35 days for calendar mini-view
  const thirtyFiveDaysAgo = new Date(now);
  thirtyFiveDaysAgo.setDate(now.getDate() - 35);
  const oldSessions = sessions.filter(s => new Date(s.session_date) > thirtyFiveDaysAgo);
  
  // Create a Set for O(1) lookup
  const oldSessionDateSet = new Set(
    oldSessions.map(s => new Date(s.session_date).toDateString())
  );
  
  // Create 5 weeks of calendar data
  const calendarWeeks: (number | null)[][] = [];
  for (let week = 0; week < 5; week++) {
    const weekData: (number | null)[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(thirtyFiveDaysAgo);
      date.setDate(thirtyFiveDaysAgo.getDate() + (week * 7) + day);
      
      if (date > now) {
        weekData.push(null);
      } else {
        const dayNum = date.getDate();
        const hasSession = oldSessionDateSet.has(date.toDateString());
        weekData.push(hasSession ? dayNum : null);
      }
    }
    calendarWeeks.push(weekData);
  }

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-400">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="font-gothic text-lg text-primary uppercase tracking-wider">System Objectives</h3>
      </div>

      {/* Progress Arrow */}
      <div className="mb-4 flex justify-center">
        <div className="h-2 w-full max-w-[200px] rounded-full bg-gradient-to-r from-primary via-accent to-primary relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-accent border-y-4 border-y-transparent" />
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Week Progress */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekProgress.map((completed, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${
              completed ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1 mb-4">
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`
                  h-6 text-xs flex items-center justify-center rounded
                  ${day ? 'text-muted-foreground hover:bg-muted/30 cursor-pointer' : ''}
                `}
              >
                {day}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Goal Progress Bars */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        {goals.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs uppercase tracking-[0.15em]">
            No objectives registered
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const progress = goal.current_value || 0;
            const target = goal.target_value || 100;
            const percentage = Math.min(100, (progress / target) * 100);
            
            return (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground truncate max-w-[180px] uppercase tracking-[0.1em]">
                    OBJECTIVE: {goal.name}
                  </span>
                  <span className="text-xs text-primary font-bold">{Math.round(percentage)}%</span>
                </div>
                <div className="system-progress h-2">
                  <div 
                    className="system-progress-fill h-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GoalPanel;
