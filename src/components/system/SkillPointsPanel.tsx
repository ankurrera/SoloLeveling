import { CircularProgress } from "./CircularProgress";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useStats } from "@/hooks/useStats";

const SkillPointsPanel = () => {
  const { profile } = useProfile();
  const { sessions } = useWorkoutSessions();
  const { stats } = useStats();

  // Skill Points = total_XP / 10 (not spendable, just for visual progression)
  const totalXP = profile?.xp || 0;
  const currentLevel = profile?.level || 1;
  const skillPoints = Math.floor(totalXP / 10);

  // Get last 30 days of sessions for the chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSessions = sessions.filter(s => new Date(s.session_date) > thirtyDaysAgo);
  
  // Group sessions by full date (YYYY-MM-DD) to avoid collision across months
  const sessionsByDate = recentSessions.reduce((acc, session) => {
    const date = new Date(session.session_date);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and take last 6 dates with workouts, showing day of month
  const skillBars = Object.entries(sessionsByDate)
    .map(([dateKey, count]) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      return {
        day,
        value: Math.min(100, count * 30) // Scale: 1 session = 30%, 3+ sessions = 100%
      };
    })
    .sort((a, b) => a.day - b.day)
    .slice(-6);

  // Fill with default if no data
  if (skillBars.length === 0) {
    skillBars.push(
      { day: 1, value: 0 },
      { day: 7, value: 0 },
      { day: 14, value: 0 },
      { day: 21, value: 0 },
      { day: 28, value: 0 }
    );
  }

  const completedDays = recentSessions.length;
  
  // Health = (Recovery + Endurance + Consistency) / 3
  const healthPercentage = stats?.health || 35;

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-200">
      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <CircularProgress value={skillPoints} max={1000} label="SKILL PTS" />
      </div>

      {/* Skill Points Title */}
      <h3 className="text-center font-gothic text-lg text-primary mb-4 uppercase tracking-wider">Skill Points</h3>

      {/* Bar Chart - Completed Days in Last 30 Days */}
      <div className="flex items-end justify-between gap-2 h-32 mb-2">
        {skillBars.map((bar, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full rounded-t bg-gradient-to-t from-primary to-accent relative group cursor-pointer"
              style={{ 
                height: `${bar.value}%`,
                transition: `height 0.8s ease-out ${index * 100}ms`
              }}
              title={`Day ${bar.day}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">{bar.day}</span>
          </div>
        ))}
      </div>

      {/* Completed Days */}
      <div className="text-center text-xs text-muted-foreground mb-4 uppercase tracking-[0.1em]">
        Completed Days (Last 30): {completedDays}
      </div>

      {/* Health Bar */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Health</span>
          <span className="text-xs text-accent">{healthPercentage}%</span>
        </div>
        <div className="system-progress">
          <div 
            className="system-progress-fill"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="text-right text-xs text-muted-foreground mt-1 uppercase tracking-[0.1em]">
          Balance: {Math.round(healthPercentage)}/100
        </div>
      </div>
    </div>
  );
};

export default SkillPointsPanel;
