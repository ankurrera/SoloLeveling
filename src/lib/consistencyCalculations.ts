/**
 * Consistency-based XP calculation utilities
 * Implements the progressive XP system with streak bonuses and consistency multipliers
 */

export type ConsistencyState = 'consistent' | 'partial' | 'broken' | 'neutral';

export interface AttendanceRecord {
  date: string;
  timeSpentMinutes: number;
  goalMinutes: number;
}

/**
 * Calculate the consistency multiplier based on streak and state
 * @param currentStreak Current streak count
 * @param consistencyState Current consistency state
 * @returns Multiplier value (0.5 to 2.0)
 */
export function calculateConsistencyMultiplier(
  currentStreak: number,
  consistencyState: ConsistencyState
): number {
  switch (consistencyState) {
    case 'consistent':
      // Progressive bonus: starts at 1.0, increases by 0.05 per streak day, caps at 2.0
      return Math.min(1.0 + (currentStreak * 0.05), 2.0);
    case 'partial':
      // Reduced XP for partial consistency
      return 0.8;
    case 'broken':
      // Penalty for broken consistency
      return 0.5;
    case 'neutral':
    default:
      // Base XP
      return 1.0;
  }
}

/**
 * Calculate XP earned for a single day
 * @param baseXp Base XP value for the skill/characteristic
 * @param timeSpent Time spent in minutes
 * @param goalMinutes Goal time in minutes
 * @param currentStreak Current streak count
 * @param consistencyState Current consistency state
 * @returns XP earned (integer)
 */
export function calculateDailyXp(
  baseXp: number,
  timeSpent: number,
  goalMinutes: number,
  currentStreak: number,
  consistencyState: ConsistencyState
): number {
  // Calculate goal completion ratio (0.0 to 1.0+)
  const goalCompletionRatio = Math.min(timeSpent / Math.max(goalMinutes, 1), 1.0);
  
  // Time multiplier: partial credit for partial completion
  const timeMultiplier = goalCompletionRatio;
  
  // Get consistency multiplier
  const consistencyMultiplier = calculateConsistencyMultiplier(currentStreak, consistencyState);
  
  // Calculate final XP
  const finalXp = Math.floor(baseXp * timeMultiplier * consistencyMultiplier);
  
  return Math.max(finalXp, 0);
}

/**
 * Determine if a day's goal was met
 * @param timeSpent Time spent in minutes
 * @param goalMinutes Goal time in minutes
 * @returns true if goal was met (>= 100%), false otherwise
 */
export function isGoalMet(timeSpent: number, goalMinutes: number): boolean {
  return timeSpent >= goalMinutes;
}

/**
 * Analyze attendance records to calculate streak and consistency state
 * @param attendanceRecords Sorted array of attendance records (most recent first)
 * @param goalType 'daily' or 'weekly'
 * @returns Object with currentStreak, bestStreak, and consistencyState
 */
export function analyzeConsistency(
  attendanceRecords: AttendanceRecord[],
  goalType: 'daily' | 'weekly' = 'daily'
): {
  currentStreak: number;
  bestStreak: number;
  consistencyState: ConsistencyState;
} {
  if (attendanceRecords.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      consistencyState: 'neutral',
    };
  }

  // Sort records by date descending (most recent first)
  const sorted = [...attendanceRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;
  let consistentDays = 0;
  let partialDays = 0;
  let missedDays = 0;

  // Calculate streaks - iterate from most recent to oldest
  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const currentDate = new Date(record.date);
    const goalMet = isGoalMet(record.timeSpentMinutes, record.goalMinutes);

    if (goalMet) {
      if (lastDate === null) {
        // First record (most recent)
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
          currentStreak = tempStreak;
        } else {
          // Streak broken - gap in days
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          // Current streak only applies to the most recent consecutive days
          if (currentStreak === 0) {
            currentStreak = 0;
          }
        }
      }
      
      consistentDays++;
    } else {
      // Goal not met
      if (record.timeSpentMinutes > 0) {
        partialDays++;
      } else {
        missedDays++;
      }
      
      // Break streak
      bestStreak = Math.max(bestStreak, tempStreak);
      if (i === 0) {
        // Most recent day didn't meet goal, so no current streak
        currentStreak = 0;
      }
      tempStreak = 0;
    }

    lastDate = currentDate;
  }

  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  // Determine consistency state based on recent performance (last 7 days)
  const recentRecords = sorted.slice(0, Math.min(7, sorted.length));
  const recentGoalsMet = recentRecords.filter(r => 
    isGoalMet(r.timeSpentMinutes, r.goalMinutes)
  ).length;
  const recentTotal = recentRecords.length;

  let consistencyState: ConsistencyState;
  if (recentTotal === 0) {
    consistencyState = 'neutral';
  } else if (recentGoalsMet === recentTotal && currentStreak > 0) {
    consistencyState = 'consistent';
  } else if (recentGoalsMet / recentTotal >= 0.5) {
    consistencyState = 'partial';
  } else {
    consistencyState = 'broken';
  }

  return {
    currentStreak,
    bestStreak,
    consistencyState,
  };
}

/**
 * Get a human-readable consistency status message
 * @param consistencyState Current consistency state
 * @param currentStreak Current streak count
 * @returns Status message string
 */
export function getConsistencyStatusMessage(
  consistencyState: ConsistencyState,
  currentStreak: number
): string {
  switch (consistencyState) {
    case 'consistent':
      if (currentStreak >= 30) return '🔥 On Fire!';
      if (currentStreak >= 14) return '💪 Crushing It!';
      if (currentStreak >= 7) return '✨ Building Momentum';
      return '✓ Consistent';
    case 'partial':
      return '~ Recovering';
    case 'broken':
      return '⚠ Inconsistent';
    case 'neutral':
    default:
      return '○ Not Started';
  }
}

/**
 * Calculate XP to next level
 * Based on the existing level formula: Level = floor(sqrt(XP / 100)) + 1
 * @param currentXp Current XP amount
 * @returns XP needed to reach next level
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = Math.floor(Math.sqrt(currentXp / 100)) + 1;
  const nextLevel = currentLevel + 1;
  
  // Reverse the formula: XP = ((level - 1)^2) * 100
  const nextLevelXp = Math.pow(nextLevel - 1, 2) * 100;
  
  return nextLevelXp - currentXp;
}

/**
 * Calculate XP required for a specific level
 * @param level Target level
 * @returns XP required to reach that level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}
