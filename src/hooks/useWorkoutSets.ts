import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type WorkoutSet = Tables<"workout_sets">;

export interface CreateWorkoutSetData {
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg?: number;
  reps: number;
  rest_time_seconds?: number;
  notes?: string;
}

export interface UpdateWorkoutSetData {
  weight_kg?: number;
  reps?: number;
  rest_time_seconds?: number;
  notes?: string;
}

export const useWorkoutSets = () => {
  const queryClient = useQueryClient();

  // Fetch all sets for a session
  const getSessionSets = (sessionId: string) => {
    return useQuery({
      queryKey: ["workout_sets", sessionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("workout_sets")
          .select("*")
          .eq("session_id", sessionId)
          .order("exercise_id")
          .order("set_number");
        
        if (error) throw error;
        return data as WorkoutSet[];
      },
      enabled: !!sessionId,
    });
  };

  // Create a new set
  const createSet = useMutation({
    mutationFn: async (data: CreateWorkoutSetData) => {
      const { data: set, error } = await supabase
        .from("workout_sets")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return set;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout_sets", variables.session_id] });
      queryClient.invalidateQueries({ queryKey: ["workout_sessions"] });
    },
  });

  // Update a set
  const updateSet = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateWorkoutSetData }) => {
      const { data, error } = await supabase
        .from("workout_sets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workout_sets", data.session_id] });
      queryClient.invalidateQueries({ queryKey: ["workout_sessions"] });
    },
  });

  // Delete a set
  const deleteSet = useMutation({
    mutationFn: async (id: string) => {
      // Get session_id before deleting for cache invalidation
      const { data: setData } = await supabase
        .from("workout_sets")
        .select("session_id")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("workout_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return setData;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workout_sets", data.session_id] });
        queryClient.invalidateQueries({ queryKey: ["workout_sessions"] });
      }
    },
  });

  // Bulk create sets for quick logging
  const bulkCreateSets = useMutation({
    mutationFn: async (sets: CreateWorkoutSetData[]) => {
      const { data, error } = await supabase
        .from("workout_sets")
        .insert(sets)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        const sessionId = variables[0].session_id;
        queryClient.invalidateQueries({ queryKey: ["workout_sets", sessionId] });
        queryClient.invalidateQueries({ queryKey: ["workout_sessions"] });
      }
    },
  });

  return {
    getSessionSets,
    createSet: createSet.mutate,
    createSetAsync: createSet.mutateAsync,
    updateSet: updateSet.mutate,
    updateSetAsync: updateSet.mutateAsync,
    deleteSet: deleteSet.mutate,
    deleteSetAsync: deleteSet.mutateAsync,
    bulkCreateSets: bulkCreateSets.mutate,
    bulkCreateSetsAsync: bulkCreateSets.mutateAsync,
  };
};
