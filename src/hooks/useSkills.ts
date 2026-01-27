import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  area: string | null;
  cover_image: string | null;
  xp: number;
  level: number;
  is_active: boolean;
  related_characteristics: string[];
  goal_type: 'daily' | 'weekly';
  goal_minutes: number;
  base_xp: number;
  current_streak: number;
  best_streak: number;
  consistency_state: 'consistent' | 'partial' | 'broken' | 'neutral';
  /**
   * Metric contribution mappings: { metricId: weight (0-1) }
   * Skills contribute XP to Core Metrics based on these weights.
   * If null/undefined, default mappings based on skill area are used.
   */
  contributes_to: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillInput {
  name: string;
  description?: string;
  area?: string;
  cover_image?: string;
  xp?: number;
  is_active?: boolean;
  related_characteristics?: string[];
  goal_type: 'daily' | 'weekly';
  goal_minutes: number;
  base_xp: number;
  /**
   * Metric contribution mappings: { metricId: weight (0-1) }
   * If not provided, default mappings based on skill area will be used.
   */
  contributes_to?: Record<string, number>;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  area?: string;
  cover_image?: string;
  xp?: number;
  is_active?: boolean;
  related_characteristics?: string[];
  goal_type?: 'daily' | 'weekly';
  goal_minutes?: number;
  base_xp?: number;
  current_streak?: number;
  best_streak?: number;
  consistency_state?: 'consistent' | 'partial' | 'broken' | 'neutral';
  /**
   * Metric contribution mappings: { metricId: weight (0-1) }
   */
  contributes_to?: Record<string, number> | null;
}

export const useSkills = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all skills for the current user
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['skills', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Skill[];
    },
    enabled: !!user,
  });

  // Create a new skill
  const createSkill = useMutation({
    mutationFn: async (input: CreateSkillInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('skills')
        .insert([{
          user_id: user.id,
          ...input,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Skill;
    },
    onSuccess: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Skills CRUD] Skill created - invalidating queries');
      }
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create skill:', error);
      toast.error('Failed to create skill');
    },
  });

  // Update a skill
  const updateSkill = useMutation({
    mutationFn: async ({ id, ...input }: UpdateSkillInput & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('skills')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Skill;
    },
    onSuccess: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Skills CRUD] Skill updated - invalidating queries');
      }
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update skill:', error);
      toast.error('Failed to update skill');
    },
  });

  // Delete a skill
  const deleteSkill = useMutation({
    mutationFn: async (skillId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Skills CRUD] Skill deleted - invalidating queries');
      }
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete skill:', error);
      toast.error('Failed to delete skill');
    },
  });

  return {
    skills,
    isLoading,
    createSkill,
    updateSkill,
    deleteSkill,
  };
};
