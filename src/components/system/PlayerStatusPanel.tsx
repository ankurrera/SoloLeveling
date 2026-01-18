import { Shield, Zap } from "lucide-react";

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
  // Mock data - would come from server
  const playerData = {
    level: 1,
    rank: "E",
    class: "Hunter",
    stats: {
      strength: 45,
      endurance: 38,
      recovery: 52,
      consistency: 67,
    },
    financial: {
      current: 1.1,
      max: 500,
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
            <span className="text-xs text-muted-foreground">Level</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-foreground">{playerData.level}</span>
            <span className="text-lg text-primary">Level</span>
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
        <div className="text-xs text-muted-foreground mb-1">Financial</div>
        <div className="flex items-baseline gap-1">
          <span className="text-accent text-lg font-bold">0</span>
          <span className="text-2xl font-bold text-foreground">{playerData.financial.current}</span>
          <span className="text-muted-foreground">/{playerData.financial.max}</span>
        </div>
        
        {/* Additional stats rows */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Planning</span>
            <span className="text-foreground">500</span>
          </div>
          <StatBar label="LEARNING" value={60} maxValue={100} delay={400} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Creativity</span>
            <span className="text-foreground">500</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
