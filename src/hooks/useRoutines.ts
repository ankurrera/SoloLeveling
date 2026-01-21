import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import type { Exercise } from "./useExercises";

export type Routine = Tables<"routines">;

export interface RoutineWithExercises extends Routine {
  exercises: Exercise[];
}

export interface CreateRoutineData {
  name: string;
  description?: string;
  muscle_groups: string[];
  exercise_ids: string[];
  is_favorite?: boolean;
}

export const useRoutines = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user routines
  const { data: routines, isLoading } = useQuery({
    queryKey: ["routines", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Routine[];
    },
    enabled: !!user,
  });

  // Fetch routine with full exercise details
  const getRoutineWithExercises = async (routineId: string): Promise<RoutineWithExercises> => {
    const { data: routine, error: routineError } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .single();
    
    if (routineError) throw routineError;

    // Fetch exercises based on exercise_ids
    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("*")
      .in("id", routine.exercise_ids);
    
    if (exercisesError) throw exercisesError;

    return {
      ...routine,
      exercises: exercises as Exercise[],
    };
  };

  // Create routine mutation
  const createRoutine = useMutation({
    mutationFn: async (data: CreateRoutineData) => {
      if (!user) throw new Error("User not authenticated");

      const { data: routine, error } = await supabase
        .from("routines")
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          muscle_groups: data.muscle_groups,
          exercise_ids: data.exercise_ids,
          is_favorite: data.is_favorite || false,
        })
        .select()
        .single();

      if (error) throw error;
      return routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", user?.id] });
    },
  });

  // Update routine mutation
  const updateRoutine = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateRoutineData> }) => {
      const { data, error } = await supabase
        .from("routines")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", user?.id] });
    },
  });

  // Delete routine mutation
  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", user?.id] });
    },
  });

  // Update last_used_at when starting a workout
  const markRoutineAsUsed = useMutation({
    mutationFn: async (routineId: string) => {
      const { error } = await supabase
        .from("routines")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", routineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", user?.id] });
    },
  });

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("routines")
        .update({ is_favorite: isFavorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", user?.id] });
    },
  });

  return {
    routines,
    isLoading,
    getRoutineWithExercises,
    createRoutine: createRoutine.mutate,
    createRoutineAsync: createRoutine.mutateAsync,
    updateRoutine: updateRoutine.mutate,
    updateRoutineAsync: updateRoutine.mutateAsync,
    deleteRoutine: deleteRoutine.mutate,
    deleteRoutineAsync: deleteRoutine.mutateAsync,
    markRoutineAsUsed: markRoutineAsUsed.mutate,
    markRoutineAsUsedAsync: markRoutineAsUsed.mutateAsync,
    toggleFavorite: toggleFavorite.mutate,
    toggleFavoriteAsync: toggleFavorite.mutateAsync,
  };
};
