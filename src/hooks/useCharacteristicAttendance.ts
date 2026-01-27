import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { analyzeConsistency } from '@/lib/consistencyCalculations';

export interface CharacteristicAttendance {
  id: string;
  characteristic_id: string;
  user_id: string;
  attendance_date: string;
  time_spent_minutes: number;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceInput {
  attendance_date: string;
  time_spent_minutes: number;
}

export const useCharacteristicAttendance = (characteristicId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch attendance records for a characteristic
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['characteristic_attendance', characteristicId, user?.id],
    queryFn: async () => {
      if (!user || !characteristicId) return [];
      
      const { data, error } = await supabase
        .from('characteristic_attendance')
        .select('*')
        .eq('characteristic_id', characteristicId)
        .eq('user_id', user.id)
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      return data as CharacteristicAttendance[];
    },
    enabled: !!user && !!characteristicId,
  });

  // Mark or update attendance for a characteristic
  const markAttendance = useMutation({
    mutationFn: async ({ attendance_date, time_spent_minutes }: AttendanceInput) => {
      if (!user || !characteristicId) throw new Error('User not authenticated or characteristic not selected');

      // Check if attendance already exists for this date
      const { data: existing } = await supabase
        .from('characteristic_attendance')
        .select('id')
        .eq('characteristic_id', characteristicId)
        .eq('user_id', user.id)
        .eq('attendance_date', attendance_date)
        .single();

      if (existing) {
        // Update existing attendance
        const { data, error } = await supabase
          .from('characteristic_attendance')
          .update({ time_spent_minutes })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as CharacteristicAttendance;
      } else {
        // Create new attendance
        const { data, error } = await supabase
          .from('characteristic_attendance')
          .insert([{
            characteristic_id: characteristicId,
            user_id: user.id,
            attendance_date,
            time_spent_minutes,
          }])
          .select()
          .single();

        if (error) throw error;
        return data as CharacteristicAttendance;
      }
    },
    onSuccess: async (data) => {
      // Invalidate attendance records
      queryClient.invalidateQueries({ queryKey: ['characteristic_attendance', characteristicId] });
      
      // Recalculate consistency and update the characteristic
      await updateCharacteristicConsistency();
      
      toast.success('Attendance marked successfully!');
    },
    onError: (error) => {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to mark attendance');
    },
  });

  // Delete attendance record
  const deleteAttendance = useMutation({
    mutationFn: async (attendanceId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('characteristic_attendance')
        .delete()
        .eq('id', attendanceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['characteristic_attendance', characteristicId] });
      
      // Recalculate consistency and update the characteristic
      await updateCharacteristicConsistency();
      
      toast.success('Attendance deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete attendance:', error);
      toast.error('Failed to delete attendance');
    },
  });

  // Helper function to update characteristic consistency based on attendance records
  const updateCharacteristicConsistency = async () => {
    if (!characteristicId || !user) return;

    // Get the characteristic data
    const { data: characteristic } = await supabase
      .from('characteristics')
      .select('goal_minutes, goal_type')
      .eq('id', characteristicId)
      .single();

    if (!characteristic) return;

    // Get all attendance records
    const { data: records } = await supabase
      .from('characteristic_attendance')
      .select('attendance_date, time_spent_minutes, xp_earned')
      .eq('characteristic_id', characteristicId)
      .eq('user_id', user.id)
      .order('attendance_date', { ascending: false });

    if (!records) return;

    // Analyze consistency
    const analysis = analyzeConsistency(
      records.map(r => ({
        date: r.attendance_date,
        timeSpentMinutes: r.time_spent_minutes,
        goalMinutes: characteristic.goal_minutes,
      })),
      characteristic.goal_type
    );

    // Calculate total XP from all attendance records
    const totalXp = records.reduce((sum, r) => sum + (r.xp_earned || 0), 0);

    // Update the characteristic with new consistency data and XP
    await supabase
      .from('characteristics')
      .update({
        current_streak: analysis.currentStreak,
        best_streak: analysis.bestStreak,
        consistency_state: analysis.consistencyState,
        xp: totalXp,
      })
      .eq('id', characteristicId)
      .eq('user_id', user.id);

    // Invalidate characteristics query to refresh UI
    queryClient.invalidateQueries({ queryKey: ['characteristics'] });
  };

  return {
    attendanceRecords,
    isLoading,
    markAttendance,
    deleteAttendance,
    updateCharacteristicConsistency,
  };
};
