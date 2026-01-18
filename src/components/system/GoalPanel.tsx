import { Target } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  progress: number;
  target: number;
}

const GoalPanel = () => {
  const goals: Goal[] = [
    { id: "1", name: "Bench 100kg", progress: 75, target: 100 },
    { id: "2", name: "6-Month Streak", progress: 45, target: 180 },
    { id: "3", name: "Pull-up Master", progress: 60, target: 100 },
  ];

  // Week view data
  const weekDays = ["S", "W", "T", "W", "T", "F", "F"];
  const weekProgress = [true, true, false, true, true, false, false];

  // Calendar data for goal tracking
  const calendarWeeks = [
    [null, null, null, null, 4, 5, null],
    [1, 12, 3, 11, 15, 10, null],
    [11, 12, 13, 11, 13, 24, null],
    [24, 29, 20, 25, 29, 30, null],
    [37, null, null, null, null, null, null],
  ];

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-400">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="font-gothic text-lg text-primary">Goal</h3>
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
        {goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">{goal.name}</span>
              <span className="text-xs text-primary">{Math.round((goal.progress / goal.target) * 100)}%</span>
            </div>
            <div className="system-progress h-2">
              <div 
                className="system-progress-fill h-full"
                style={{ width: `${(goal.progress / goal.target) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalPanel;
