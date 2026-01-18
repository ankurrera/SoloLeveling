import { CircularProgress } from "./CircularProgress";

interface SkillBar {
  day: number;
  value: number;
}

const SkillPointsPanel = () => {
  const skillBars: SkillBar[] = [
    { day: 1, value: 30 },
    { day: 4, value: 45 },
    { day: 5, value: 55 },
    { day: 18, value: 75 },
    { day: 11, value: 60 },
    { day: 20, value: 90 },
  ];

  const completedDays = 696;
  const healthPercentage = 40;

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-200">
      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <CircularProgress value={completedDays} max={1000} label="BONUS" />
      </div>

      {/* Skill Points Title */}
      <h3 className="text-center font-gothic text-lg text-primary mb-4">Skill Points</h3>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32 mb-2">
        {skillBars.map((bar, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full rounded-t bg-gradient-to-t from-primary to-accent relative group"
              style={{ 
                height: `${bar.value}%`,
                transition: `height 0.8s ease-out ${index * 100}ms`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">{bar.day}</span>
          </div>
        ))}
      </div>

      {/* Completed Days */}
      <div className="text-center text-xs text-muted-foreground mb-4">
        Completed Days
      </div>

      {/* Health Bar */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase">Health</span>
          <span className="text-xs text-accent">{healthPercentage}%</span>
        </div>
        <div className="system-progress">
          <div 
            className="system-progress-fill"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="text-right text-xs text-muted-foreground mt-1">500</div>
      </div>
    </div>
  );
};

export default SkillPointsPanel;
