import { Shield, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useStats } from "@/hooks/useStats";

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  delay?: number;
}

const StatBar = ({ label, value, maxValue, delay = 0 }: StatBarProps) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="stat-label text-xs">{label}</span>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <div className="system-progress">
        <div 
          className="system-progress-fill"
          style={{ 
            width: `${percentage}%`,
            animationDelay: `${delay}ms`
          }}
        />
      </div>
    </div>
  );
};

const PlayerStatusPanel = () => {
  const { profile, isLoading } = useProfile();
  const { sessions, calculateStats } = useWorkoutSessions();
  const { stats: calculatedStats, isLoading: statsLoading } = useStats();
  
  if (isLoading || statsLoading) {
    return (
      <div className="system-panel p-5">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const sessionStats = calculateStats(sessions);
  const level = profile?.level || 1;
  const currentXP = profile?.xp || 0;
  const xpForNextLevel = level * 100;
  
  // Use calculated stats from database functions
  const stats = calculatedStats || {
    strength: 30,
    endurance: 25,
    recovery: 50,
    consistency: 0,
    mobility: 30,
    health: 35
  };
  
  const playerData = {
    level,
    rank: profile?.rank || "E",
    class: profile?.player_class || "Hunter",
    stats: {
      strength: stats.strength,
      endurance: stats.endurance,
      recovery: stats.recovery,
      consistency: stats.consistency,
    }
  };

  return (
    <div className="system-panel p-5 hover-glow animate-fade-in-up">
      {/* Avatar Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border-2 border-primary/50 flex items-center justify-center animate-pulse-glow">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              <Shield className="w-8 h-8 text-primary/70" />
            </div>
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 bg-background border border-primary rounded-full px-2 py-0.5 text-xs font-bold text-primary">
            Lv.{playerData.level}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-[0.1em]">Level</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-foreground">{playerData.level}</span>
            <span className="text-lg text-primary uppercase tracking-wider">Level</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
              <Zap className="w-3 h-3" />
              {playerData.level}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bars */}
      <div className="space-y-1">
        <StatBar 
          label="STRENGTH" 
          value={playerData.stats.strength} 
          maxValue={100}
          delay={0}
        />
        <StatBar 
          label="ENDURANCE" 
          value={playerData.stats.endurance} 
          maxValue={100}
          delay={100}
        />
        <StatBar 
          label="RECOVERY" 
          value={playerData.stats.recovery} 
          maxValue={100}
          delay={200}
        />
        <StatBar 
          label="CONSISTENCY" 
          value={playerData.stats.consistency} 
          maxValue={100}
          delay={300}
        />
      </div>

      {/* Financial/XP Section */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-[0.15em]">Experience Points</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{currentXP}</span>
          <span className="text-muted-foreground">/{xpForNextLevel}</span>
        </div>
        <div className="mt-2">
          <StatBar 
            label="XP TO NEXT LEVEL" 
            value={currentXP} 
            maxValue={xpForNextLevel}
            delay={500}
          />
        </div>
        
        {/* Additional stats rows */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase tracking-[0.1em] text-xs">Total Workouts</span>
            <span className="text-foreground">{sessionStats.totalSessions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase tracking-[0.1em] text-xs">Total XP Earned</span>
            <span className="text-foreground">{sessionStats.totalXP}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase tracking-[0.1em] text-xs">Training Hours</span>
            <span className="text-foreground">{sessionStats.totalHours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
