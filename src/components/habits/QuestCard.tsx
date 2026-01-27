import { Habit } from "@/hooks/useHabits";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QuestCardProps {
  habit: Habit;
}

const QuestCard = ({ habit }: QuestCardProps) => {
  const { user } = useAuth();
  const [completionCount, setCompletionCount] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const loadQuestData = async () => {
      if (!user) return;

      // Calculate days remaining
      const createdDate = new Date(habit.created_at);
      const endDate = new Date(createdDate);
      endDate.setDate(createdDate.getDate() + habit.duration_days);
      
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));

      // Load completion count
      const { data, error, count } = await supabase
        .from('habit_completions')
        .select('id', { count: 'exact' })
        .eq('habit_id', habit.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to load quest data:', error);
        return;
      }

      setCompletionCount(count || 0);
    };

    loadQuestData();
  }, [habit, user]);

  // Determine quest status
  const totalDays = habit.duration_days;
  const completionRate = totalDays > 0 ? (completionCount / totalDays) * 100 : 0;
  const isWinning = completionRate >= 70; // Consider 70%+ as winning
  const isLosing = daysRemaining <= 3 && completionRate < 50;

  return (
    <div className="system-panel p-4 hover-glow">
      {/* Quest Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{habit.icon}</span>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {habit.name}
        </h3>
      </div>

      {/* Days Remaining */}
      <div className="text-xs text-muted-foreground mb-3">
        {daysRemaining} Days Remaining
      </div>

      {/* XP Details */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Win XP</span>
          <span className="text-xs font-semibold text-foreground">+{habit.win_xp}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Lose XP</span>
          <span className="text-xs font-semibold text-foreground">-{habit.lose_xp}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/30">
        <span className="text-muted-foreground">Status:</span>
        {isWinning && (
          <span className="text-foreground flex items-center gap-1">
            Winning ✅
          </span>
        )}
        {isLosing && (
          <span className="text-foreground flex items-center gap-1">
            Lost ❌
          </span>
        )}
        {!isWinning && !isLosing && (
          <span className="text-foreground flex items-center gap-1">
            In Progress ⏳
          </span>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-1">
          {completionCount}/{totalDays} days completed
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestCard;
