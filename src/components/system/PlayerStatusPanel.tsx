import { useProfile } from "@/hooks/useProfile";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useStats } from "@/hooks/useStats";

const PlayerStatusPanel = () => {
  const { profile, isLoading } = useProfile();
  const { sessions, calculateStats } = useWorkoutSessions();
  const { stats: calculatedStats, isLoading: statsLoading } = useStats();
  
  if (isLoading || statsLoading) {
    return (
      <div className="notion-card p-5">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const sessionStats = calculateStats(sessions);
  const level = profile?.level || 1;
  const currentXP = profile?.xp || 0;
  const xpForNextLevel = 1000;
  const displayName = profile?.display_name || "Hero";
  const coins = 225; // TODO: Connect to actual coins system when implemented
  
  // Use calculated stats from database functions
  const stats = calculatedStats || {
    strength: 30,
    endurance: 25,
    recovery: 50,
    consistency: 0,
    mobility: 30,
    health: 100
  };

  // Calculate health percentage and hearts
  const healthPercent = stats.health || 100;
  const totalHearts = 5;
  const filledHearts = Math.round((healthPercent / 100) * totalHearts);

  return (
    <div className="notion-card p-6 animate-fade-in-up">
      {/* Profile Pill at Top-Left */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Profile</span>
        </div>
      </div>

      {/* Hero Image - Large Rectangular */}
      <div className="mb-6 -mx-6 -mt-6">
        <div className="w-full aspect-[2/1] bg-gradient-to-br from-muted to-accent rounded-t-lg overflow-hidden">
          {/* Placeholder for hero image - using gradient for now */}
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-24 h-24 text-muted-foreground opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hero Info Row - Horizontal */}
      <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium">{displayName}</span>
          <span>🐱</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Level {level}</span>
          <span>📈</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>{coins} Coins</span>
          <span>💰</span>
        </div>
      </div>

      {/* Stats Section - Vertical Stack */}
      <div className="mb-6 space-y-3 text-sm">
        <div>
          <div className="text-muted-foreground mb-1">Experience</div>
          <div className="text-foreground">
            Experience (XP): ⚒️ {currentXP}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Next Level</div>
          <div className="text-foreground">
            To Next Level 💗: {xpForNextLevel - currentXP}
          </div>
        </div>
      </div>

      {/* Level Progress Bar - Monochrome Blocks */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>Level Up</span>
          <span>🚀</span>
        </div>
        
        {/* Monochrome Progress Bar */}
        <div className="notion-progress-bar">
          <div 
            className="notion-progress-fill"
            style={{ 
              width: `${Math.min((currentXP / xpForNextLevel) * 100, 100)}%`
            }}
          />
        </div>
        
        {/* Numeric Progress */}
        <div className="mt-1.5 text-xs text-muted-foreground">
          {currentXP} / {xpForNextLevel}
        </div>
      </div>

      {/* Health Section */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>Health</span>
          <span>❤️</span>
        </div>
        
        {/* Grayscale Hearts */}
        <div className="flex items-center gap-1 mb-1">
          {[...Array(totalHearts)].map((_, i) => (
            <span key={i} className={`text-xl ${i < filledHearts ? 'text-foreground opacity-60' : 'text-muted-foreground opacity-30'}`}>
              ♥
            </span>
          ))}
        </div>
        
        {/* Health Percentage */}
        <div className="text-sm text-foreground">
          {healthPercent}%
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusPanel;
