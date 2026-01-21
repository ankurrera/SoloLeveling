import { Shield, Zap, Swords, Heart, Activity, Target } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useStats } from "@/hooks/useStats";

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  icon?: React.ReactNode;
  delay?: number;
}

const StatBar = ({ label, value, maxValue, icon, delay = 0 }: StatBarProps) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary/70 w-4 h-4">{icon}</span>}
          <span className="stat-label text-xs tracking-[0.2em]">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <div className="rpg-progress-bar">
        <div 
          className="rpg-progress-fill"
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

  // Generate stars based on rank
  const rankStars = playerData.rank === 'S' ? '★★★★★' :
                    playerData.rank === 'A' ? '★★★★' :
                    playerData.rank === 'B' ? '★★★' :
                    playerData.rank === 'C' ? '★★' : '★';

  return (
    <div className="system-panel p-6 hover-glow animate-fade-in-up">
      {/* PLAYER HEADER */}
      <div className="mb-6">
        <h2 className="player-header-text text-4xl font-gothic font-bold tracking-wider mb-1">
          PLAYER
        </h2>
      </div>

      {/* Level & Rank Display */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border-2 border-primary/50 flex items-center justify-center animate-pulse-glow">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              <Shield className="w-8 h-8 text-primary/70" />
            </div>
          </div>
          {/* Level badge with pulse animation */}
          <div className="level-badge absolute -bottom-1 -right-1 bg-gradient-to-br from-primary to-accent border-2 border-primary rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            Lv.{playerData.level}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-foreground">Level {playerData.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rank:</span>
            <span className="rank-text text-base font-semibold">{playerData.rank}-Class {playerData.class}</span>
            <span className="rank-stars text-amber-400 text-sm ml-1">{rankStars}</span>
          </div>
        </div>
      </div>

      {/* Stats Bars with Icons */}
      <div className="space-y-1">
        <StatBar 
          label="STR" 
          value={playerData.stats.strength} 
          maxValue={100}
          icon={<Swords className="w-4 h-4" />}
          delay={0}
        />
        <StatBar 
          label="END" 
          value={playerData.stats.endurance} 
          maxValue={100}
          icon={<Shield className="w-4 h-4" />}
          delay={100}
        />
        <StatBar 
          label="REC" 
          value={playerData.stats.recovery} 
          maxValue={100}
          icon={<Heart className="w-4 h-4" />}
          delay={200}
        />
        <StatBar 
          label="CON" 
          value={playerData.stats.consistency} 
          maxValue={100}
          icon={<Target className="w-4 h-4" />}
          delay={300}
        />
      </div>

      {/* XP Section - RPG Style */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary/70" />
              <span className="stat-label text-xs tracking-[0.2em]">EXPERIENCE</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{currentXP}</span>
              <span className="text-sm text-muted-foreground">/ {xpForNextLevel}</span>
            </div>
          </div>
          
          {/* Segmented XP Bar */}
          <div className="segmented-xp-bar">
            <div 
              className="segmented-xp-fill"
              style={{ 
                width: `${Math.min((currentXP / xpForNextLevel) * 100, 100)}%`
              }}
            />
          </div>
          
          <div className="mt-1.5 text-xs text-muted-foreground">
            XP required to next level: <span className="text-foreground font-semibold">{Math.max(0, xpForNextLevel - currentXP)}</span>
          </div>
        </div>
        
        {/* RPG Microcopy - Quest Stats */}
        <div className="mt-4 space-y-2.5">
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground uppercase tracking-[0.12em] text-xs flex items-center gap-2">
              <Target className="w-3 h-3 text-primary/50" />
              Completed Quests
            </span>
            <span className="text-foreground font-semibold">{sessionStats.totalSessions}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground uppercase tracking-[0.12em] text-xs flex items-center gap-2">
              <Zap className="w-3 h-3 text-accent/70" />
              Lifetime XP
            </span>
            <span className="text-foreground font-semibold">{sessionStats.totalXP}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground uppercase tracking-[0.12em] text-xs flex items-center gap-2">
              <Swords className="w-3 h-3 text-destructive/60" />
              Time in Combat
            </span>
            <span className="text-foreground font-semibold">{sessionStats.totalHours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
