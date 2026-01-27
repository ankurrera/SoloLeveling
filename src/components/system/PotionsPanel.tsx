import { Droplet, Heart, Sparkles, Moon } from "lucide-react";
import { useStats } from "@/hooks/useStats";

interface Potion {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  description: string;
  color: string;
}

const PotionsPanel = () => {
  const { behaviorPatterns } = useStats();

  // Potions represent behavior patterns, not consumables
  const potions: Potion[] = [
    { 
      id: "1", 
      name: "Rest", 
      icon: <Moon className="w-5 h-5" />, 
      count: behaviorPatterns?.rest_days || 0,
      description: "Rest days taken",
      color: "from-muted to-card"
    },
    { 
      id: "2", 
      name: "Consistency", 
      icon: <Droplet className="w-5 h-5" />, 
      count: behaviorPatterns?.consistency_streaks || 0,
      description: "Training weeks with 3+ sessions",
      color: "from-muted to-card"
    },
    { 
      id: "3", 
      name: "Deload", 
      icon: <Sparkles className="w-5 h-5" />, 
      count: behaviorPatterns?.deload_weeks || 0,
      description: "Recovery weeks",
      color: "from-muted to-card"
    },
    { 
      id: "4", 
      name: "Balance", 
      icon: <Heart className="w-5 h-5" />, 
      count: behaviorPatterns?.recovery_patterns || 0,
      description: "Balanced recovery patterns",
      color: "from-muted to-card"
    },
  ];

  // Calculate additional metrics from behavior
  const totalGoodPatterns = (behaviorPatterns?.rest_days || 0) + 
                            (behaviorPatterns?.consistency_streaks || 0) + 
                            (behaviorPatterns?.recovery_patterns || 0);

  const hpBoosts: Potion[] = [
    { 
      id: "5", 
      name: "Training", 
      icon: <Heart className="w-5 h-5" />, 
      count: Math.min(10, Math.floor(totalGoodPatterns / 5)),
      description: "Balanced training adherence",
      color: "from-muted to-card"
    },
    { 
      id: "6", 
      name: "Recovery", 
      icon: <Sparkles className="w-5 h-5" />, 
      count: Math.min(10, behaviorPatterns?.recovery_patterns || 0),
      description: "Good recovery practices",
      color: "from-muted to-card"
    },
  ];

  const PotionItem = ({ potion }: { potion: Potion }) => (
    <div className="group relative flex flex-col items-center">
      {/* Potion Bottle */}
      <div className={`
        relative w-12 h-16 rounded-b-lg rounded-t-sm 
        bg-muted 
        border border-border
        transition-transform duration-300
        group-hover:scale-105
      `}>
        {/* Bottle neck */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-card rounded-t-sm border border-border" />
        
        {/* Cork */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-muted-foreground rounded-t-sm" />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {potion.icon}
        </div>
        
        {/* Count badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-primary text-[10px] font-bold flex items-center justify-center text-primary">
          {potion.count}
        </div>
      </div>
      
      {/* Label */}
      <span className="mt-2 text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
        {potion.name}
      </span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 px-2 py-1 bg-background border border-border rounded text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {potion.description}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Potions Section */}
      <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-400">
        <h3 className="font-gothic text-sm text-primary mb-4 text-center uppercase tracking-[0.15em]">Recovery Patterns</h3>
        <div className="flex justify-center gap-4">
          {potions.slice(0, 2).map((potion) => (
            <PotionItem key={potion.id} potion={potion} />
          ))}
        </div>
        <h3 className="font-gothic text-sm text-primary my-4 text-center uppercase tracking-[0.15em]">Training Patterns</h3>
        <div className="flex justify-center gap-4">
          {potions.slice(2).map((potion) => (
            <PotionItem key={potion.id} potion={potion} />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4 italic tracking-[0.1em]">
          Earned through consistent training habits
        </p>
      </div>

      {/* HP Boosts Section */}
      <div className="system-panel p-5 hover-glow animate-fade-in-up animation-delay-400">
        <h3 className="font-gothic text-sm text-primary mb-4 text-center uppercase tracking-[0.15em]">System Rewards</h3>
        <div className="flex justify-center gap-6">
          {hpBoosts.map((potion) => (
            <PotionItem key={potion.id} potion={potion} />
          ))}
        </div>
        <h3 className="font-gothic text-sm text-primary mt-6 mb-4 text-center uppercase tracking-[0.15em]">Balance Indicators</h3>
        <div className="flex justify-center gap-6">
          <PotionItem potion={{ ...hpBoosts[0], name: "Habit", count: behaviorPatterns?.consistency_streaks || 0 }} />
          <PotionItem potion={{ ...hpBoosts[1], name: "Rest", count: Math.min(10, Math.floor((behaviorPatterns?.rest_days || 0) / 3)) }} />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4 italic tracking-[0.1em]">
          Generated from behavior analysis
        </p>
      </div>
    </div>
  );
};

export default PotionsPanel;
