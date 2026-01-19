import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  duration_minutes: number | null;
  notes: string | null;
  total_xp_earned: number | null;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_type: string | null;
  order_index: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithDetails extends WorkoutSession {
  exercises: (SessionExercise & { sets: ExerciseSet[] })[];
}

export const useWorkoutSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all workout sessions for the user
  const sessionsQuery = useQuery({
    queryKey: ['workout_sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false });
      
      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!user
  });

  // Fetch a single session with all exercises and sets
  const getSessionDetails = async (sessionId: string): Promise<SessionWithDetails | null> => {
    if (!user) return null;

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) return null;

    // Fetch exercises for this session
    const { data: exercises, error: exercisesError } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (exercisesError) throw exercisesError;

    // Fetch sets for each exercise
    const exercisesWithSets = await Promise.all(
      (exercises || []).map(async (exercise) => {
        const { data: sets, error: setsError } = await supabase
          .from('exercise_sets')
          .select('*')
          .eq('exercise_id', exercise.id)
          .order('set_number', { ascending: true });

        if (setsError) throw setsError;

        return {
          ...exercise,
          sets: sets || []
        };
      })
    );

    return {
      ...session,
      exercises: exercisesWithSets
    } as SessionWithDetails;
  };

  // Create a new workout session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: Omit<WorkoutSession, 'id' | 'user_id' | 'total_xp_earned' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ ...sessionData, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Ready to log your workout!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create session: ${error.message}`);
    }
  });

  // Add exercise to a session
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseData: Omit<SessionExercise, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('session_exercises')
        .insert(exerciseData)
        .select()
        .single();
      
      if (error) throw error;
      return data as SessionExercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add exercise: ${error.message}`);
    }
  });

  // Add set to an exercise
  const addSetMutation = useMutation({
    mutationFn: async (setData: Omit<ExerciseSet, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('exercise_sets')
        .insert(setData)
        .select()
        .single();
      
      if (error) throw error;
      return data as ExerciseSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add set: ${error.message}`);
    }
  });

  // Update an exercise
  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SessionExercise> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('session_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SessionExercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update exercise: ${error.message}`);
    }
  });

  // Delete an exercise (cascades to sets)
  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete exercise: ${error.message}`);
    }
  });

  // Update a set
  const updateSetMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExerciseSet> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('exercise_sets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ExerciseSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update set: ${error.message}`);
    }
  });

  // Delete a set
  const deleteSetMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('exercise_sets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete set: ${error.message}`);
    }
  });

  // Update a workout session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkoutSession> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
      toast.success('Session updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update session: ${error.message}`);
    }
  });

  // Delete a workout session (cascades to exercises and sets)
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions', user?.id] });
      toast.success('Session deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete session: ${error.message}`);
    }
  });

  // Calculate stats from all sessions
  const calculateStats = (sessions: WorkoutSession[]) => {
    const IDEAL_SESSIONS_PER_MONTH = 12; // 3 sessions per week is ideal consistency
    const DAYS_IN_MONTH = 30;
    
    const totalSessions = sessions.length;
    const totalXP = sessions.reduce((sum, session) => sum + (session.total_xp_earned || 0), 0);
    const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    
    // Calculate consistency (sessions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAYS_IN_MONTH);
    const recentSessions = sessions.filter(s => new Date(s.session_date) > thirtyDaysAgo);
    
    return {
      totalSessions,
      totalXP,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      consistency: Math.min(100, (recentSessions.length / IDEAL_SESSIONS_PER_MONTH) * 100),
      recentSessionCount: recentSessions.length
    };
  };

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    getSessionDetails,
    createSession: createSessionMutation.mutate,
    addExercise: addExerciseMutation.mutate,
    addSet: addSetMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    updateExercise: updateExerciseMutation.mutate,
    updateSet: updateSetMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    deleteExercise: deleteExerciseMutation.mutate,
    deleteSet: deleteSetMutation.mutate,
    calculateStats,
    isCreatingSession: createSessionMutation.isPending,
    isAddingExercise: addExerciseMutation.isPending,
    isAddingSet: addSetMutation.isPending
  };
};
