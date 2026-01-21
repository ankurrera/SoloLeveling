import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  player_class: string | null;
  rank: string | null;
  level: number | null;
  xp: number | null;
  fatigue_level: number | null;
  bodyweight_kg: number | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  deadline: string | null;
  is_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingPreferences {
  id: string;
  user_id: string;
  workout_frequency: number | null;
  preferred_days: string[] | null;
  rest_day_notification: boolean | null;
  session_duration_minutes: number | null;
  focus_areas: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user
  });

  const goalsQuery = useQuery({
    queryKey: ['training_goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TrainingGoal[];
    },
    enabled: !!user
  });

  const preferencesQuery = useQuery({
    queryKey: ['training_preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('training_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TrainingPreferences | null;
    },
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<TrainingPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('training_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_preferences', user?.id] });
      toast.success('Preferences updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<TrainingGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('training_goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_goals', user?.id] });
      toast.success('Goal added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingGoal> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('training_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_goals', user?.id] });
      toast.success('Goal updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('training_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_goals', user?.id] });
      toast.success('Goal deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    profile: profileQuery.data,
    goals: goalsQuery.data || [],
    preferences: preferencesQuery.data,
    isLoading: profileQuery.isLoading || goalsQuery.isLoading || preferencesQuery.isLoading,
    updateProfile: updateProfileMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    addGoal: addGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate
  };
};
