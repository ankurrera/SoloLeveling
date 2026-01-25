import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type HabitColor = 'purple' | 'green' | 'gold' | 'orange' | 'brown';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: HabitColor;
  win_xp: number;
  lose_xp: number;
  duration_days: number;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completed: boolean;
  created_at: string;
}

export interface CreateHabitInput {
  name: string;
  icon: string;
  color: HabitColor;
  win_xp: number;
  lose_xp: number;
  duration_days: number;
}

export const useHabits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all habits for the current user
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  // Fetch habit completions for a date range
  const fetchHabitCompletions = async (habitId: string, startDate: string, endDate: string) => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (error) throw error;
    return data as HabitCompletion[];
  };

  // Create a new habit
  const createHabit = useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert([{
          user_id: user.id,
          ...input,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create habit:', error);
      toast.error('Failed to create habit');
    },
  });

  // Toggle habit completion for a specific date
  const toggleHabitCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if completion exists
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completion_date', date)
        .single();

      if (existing) {
        // Delete if exists (toggle off)
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        return { action: 'deleted', habitId, date };
      } else {
        // Create if doesn't exist (toggle on)
        const { data, error } = await supabase
          .from('habit_completions')
          .insert([{
            habit_id: habitId,
            user_id: user.id,
            completion_date: date,
            completed: true,
          }])
          .select()
          .single();

        if (error) throw error;
        return { action: 'created', habitId, date, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit_completions'] });
    },
    onError: (error) => {
      console.error('Failed to toggle habit completion:', error);
      toast.error('Failed to update habit');
    },
  });

  // Delete a habit
  const deleteHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete habit:', error);
      toast.error('Failed to delete habit');
    },
  });

  return {
    habits,
    isLoading,
    createHabit,
    toggleHabitCompletion,
    deleteHabit,
    fetchHabitCompletions,
  };
};
