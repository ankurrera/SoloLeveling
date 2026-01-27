import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { analyzeConsistency } from '@/lib/consistencyCalculations';

export interface SkillAttendance {
  id: string;
  skill_id: string;
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

export const useSkillAttendance = (skillId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch attendance records for a skill
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['skill_attendance', skillId, user?.id],
    queryFn: async () => {
      if (!user || !skillId) return [];
      
      const { data, error } = await supabase
        .from('skill_attendance')
        .select('*')
        .eq('skill_id', skillId)
        .eq('user_id', user.id)
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      return data as SkillAttendance[];
    },
    enabled: !!user && !!skillId,
  });

  // Mark or update attendance for a skill
  const markAttendance = useMutation({
    mutationFn: async ({ attendance_date, time_spent_minutes }: AttendanceInput) => {
      if (!user || !skillId) throw new Error('User not authenticated or skill not selected');

      // Check if attendance already exists for this date
      const { data: existing } = await supabase
        .from('skill_attendance')
        .select('id')
        .eq('skill_id', skillId)
        .eq('user_id', user.id)
        .eq('attendance_date', attendance_date)
        .single();

      if (existing) {
        // Update existing attendance
        const { data, error } = await supabase
          .from('skill_attendance')
          .update({ time_spent_minutes })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as SkillAttendance;
      } else {
        // Create new attendance
        const { data, error } = await supabase
          .from('skill_attendance')
          .insert([{
            skill_id: skillId,
            user_id: user.id,
            attendance_date,
            time_spent_minutes,
          }])
          .select()
          .single();

        if (error) throw error;
        return data as SkillAttendance;
      }
    },
    onSuccess: async (data) => {
      // Invalidate attendance records
      queryClient.invalidateQueries({ queryKey: ['skill_attendance', skillId] });
      
      // Recalculate consistency and update the skill
      await updateSkillConsistency();
      
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
        .from('skill_attendance')
        .delete()
        .eq('id', attendanceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['skill_attendance', skillId] });
      
      // Recalculate consistency and update the skill
      await updateSkillConsistency();
      
      toast.success('Attendance deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete attendance:', error);
      toast.error('Failed to delete attendance');
    },
  });

  // Helper function to update skill consistency based on attendance records
  const updateSkillConsistency = async () => {
    if (!skillId || !user) return;

    // Get the skill data
    const { data: skill } = await supabase
      .from('skills')
      .select('goal_minutes, goal_type')
      .eq('id', skillId)
      .single();

    if (!skill) return;

    // Get all attendance records
    const { data: records } = await supabase
      .from('skill_attendance')
      .select('attendance_date, time_spent_minutes, xp_earned')
      .eq('skill_id', skillId)
      .eq('user_id', user.id)
      .order('attendance_date', { ascending: false });

    if (!records) return;

    // Analyze consistency
    const analysis = analyzeConsistency(
      records.map(r => ({
        date: r.attendance_date,
        timeSpentMinutes: r.time_spent_minutes,
        goalMinutes: skill.goal_minutes,
      })),
      skill.goal_type
    );

    // Calculate total XP from all attendance records
    const totalXp = records.reduce((sum, r) => sum + (r.xp_earned || 0), 0);

    // Update the skill with new consistency data and XP
    await supabase
      .from('skills')
      .update({
        current_streak: analysis.currentStreak,
        best_streak: analysis.bestStreak,
        consistency_state: analysis.consistencyState,
        xp: totalXp,
      })
      .eq('id', skillId)
      .eq('user_id', user.id);

    // Invalidate skills query to refresh UI
    queryClient.invalidateQueries({ queryKey: ['skills'] });
  };

  return {
    attendanceRecords,
    isLoading,
    markAttendance,
    deleteAttendance,
    updateSkillConsistency,
  };
};
