import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Characteristic {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  xp: number;
  level: number;
  goal_type: 'daily' | 'weekly';
  goal_minutes: number;
  base_xp: number;
  current_streak: number;
  best_streak: number;
  consistency_state: 'consistent' | 'partial' | 'broken' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface CreateCharacteristicInput {
  name: string;
  icon?: string;
  xp?: number;
  goal_type: 'daily' | 'weekly';
  goal_minutes: number;
  base_xp: number;
}

export interface UpdateCharacteristicInput {
  name?: string;
  icon?: string;
  xp?: number;
  goal_type?: 'daily' | 'weekly';
  goal_minutes?: number;
  base_xp?: number;
  current_streak?: number;
  best_streak?: number;
  consistency_state?: 'consistent' | 'partial' | 'broken' | 'neutral';
}

export const useCharacteristics = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all characteristics for the current user
  const { data: characteristics = [], isLoading } = useQuery({
    queryKey: ['characteristics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('characteristics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Characteristic[];
    },
    enabled: !!user,
  });

  // Create a new characteristic
  const createCharacteristic = useMutation({
    mutationFn: async (input: CreateCharacteristicInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('characteristics')
        .insert([{
          user_id: user.id,
          ...input,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Characteristic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characteristics'] });
      toast.success('Characteristic created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create characteristic:', error);
      toast.error('Failed to create characteristic');
    },
  });

  // Update a characteristic
  const updateCharacteristic = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCharacteristicInput & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('characteristics')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Characteristic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characteristics'] });
      toast.success('Characteristic updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update characteristic:', error);
      toast.error('Failed to update characteristic');
    },
  });

  // Delete a characteristic
  const deleteCharacteristic = useMutation({
    mutationFn: async (characteristicId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('characteristics')
        .delete()
        .eq('id', characteristicId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characteristics'] });
      toast.success('Characteristic deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete characteristic:', error);
      toast.error('Failed to delete characteristic');
    },
  });

  return {
    characteristics,
    isLoading,
    createCharacteristic,
    updateCharacteristic,
    deleteCharacteristic,
  };
};
