import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  strength: number;
  endurance: number;
  recovery: number;
  consistency: number;
  mobility: number;
  health: number;
}

export interface BehaviorPatterns {
  rest_days: number;
  consistency_streaks: number;
  deload_weeks: number;
  recovery_patterns: number;
}

export interface TrainingDay {
  day_of_month: number;
  has_workout: boolean;
}

export const useStats = () => {
  const { user } = useAuth();

  // Fetch calculated stats from database
  const statsQuery = useQuery({
    queryKey: ['user_stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('calculate_user_stats', { user_id_param: user.id });
      
      if (error) throw error;
      
      // The function returns an array with one row
      if (data && data.length > 0) {
        return data[0] as UserStats;
      }
      
      // Return default stats if no data
      return {
        strength: 30,
        endurance: 25,
        recovery: 50,
        consistency: 0,
        mobility: 30,
        health: 35
      } as UserStats;
    },
    enabled: !!user,
    staleTime: 60000 // Cache for 1 minute
  });

  // Fetch behavior patterns for potions
  const behaviorPatternsQuery = useQuery({
    queryKey: ['behavior_patterns', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('calculate_behavior_patterns', { user_id_param: user.id });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[0] as BehaviorPatterns;
      }
      
      return {
        rest_days: 0,
        consistency_streaks: 0,
        deload_weeks: 0,
        recovery_patterns: 0
      } as BehaviorPatterns;
    },
    enabled: !!user,
    staleTime: 60000
  });

  // Fetch training calendar for current month
  const getTrainingCalendar = async (year: number, month: number) => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .rpc('get_training_calendar', {
        user_id_param: user.id,
        year_param: year,
        month_param: month
      });
    
    if (error) throw error;
    
    return (data || []) as TrainingDay[];
  };

  return {
    stats: statsQuery.data,
    behaviorPatterns: behaviorPatternsQuery.data,
    isLoading: statsQuery.isLoading || behaviorPatternsQuery.isLoading,
    getTrainingCalendar,
    refetchStats: async () => {
      await Promise.all([
        statsQuery.refetch(),
        behaviorPatternsQuery.refetch()
      ]);
    }
  };
};
