/**
 * XP Calculation System for Solo Leveling
 * 
 * This module implements a sophisticated XP calculation system that rewards
 * training stress and adaptation based on objective effort metrics.
 * 
 * Core principles:
 * - XP represents training stress + adaptation
 * - XP scales with relative effort (bodyweight-normalized)
 * - No flat XP, no cosmetic rewards
 */

export interface ExerciseSet {
  reps: number;
  weight_kg: number | null;
}

export interface WorkoutData {
  sets: ExerciseSet[];
  duration_minutes: number;
  is_edited?: boolean;
}

export interface FatigueData {
  fatigue_level: number; // 0-100
}

export interface ConsistencyData {
  sessions_this_week: number;
}

export interface BodyweightData {
  bodyweight_kg?: number | null;
}

// Constants for bodyweight normalization
const DEFAULT_BODYWEIGHT_KG = 70;
const MIN_BODYWEIGHT_KG = 50;
const MAX_BODYWEIGHT_KG = 120;

// Constants for XP calculation formula
const VOLUME_COEFFICIENT = 1.5;
const DENSITY_COEFFICIENT = 0.4;
const DURATION_COEFFICIENT = 0.3;

/**
 * Clamp bodyweight to prevent exploitation
 * Uses effective range of 50-120 kg to avoid:
 * - Fake low bodyweight entries
 * - Extreme edge cases
 */
export function clampBodyweight(bodyweight: number | null | undefined): number {
  if (bodyweight === null || bodyweight === undefined || bodyweight <= 0) {
    return DEFAULT_BODYWEIGHT_KG;
  }
  return Math.max(MIN_BODYWEIGHT_KG, Math.min(MAX_BODYWEIGHT_KG, bodyweight));
}

/**
 * STEP 2 - Calculate Intensity Factor
 * Approximates intensity using rep ranges.
 * Lower reps = heavier weight = higher intensity
 */
export function calculateIntensityFactor(reps: number): number {
  if (reps <= 5) return 1.3;
  if (reps <= 8) return 1.15;
  if (reps <= 12) return 1.0;
  if (reps <= 20) return 0.9;
  return 0.9; // 20+ reps
}

/**
 * STEP 1 - Calculate Total Volume
 * Total volume = Σ (weight × reps) across all sets
 */
export function calculateTotalVolume(sets: ExerciseSet[]): number {
  return sets.reduce((total, set) => {
    const weight = set.weight_kg ?? 0;
    return total + (weight * set.reps);
  }, 0);
}

/**
 * Calculate average intensity factor for the session
 */
export function calculateAverageIntensity(sets: ExerciseSet[]): number {
  if (sets.length === 0) return 1.0;
  
  const totalIntensity = sets.reduce((total, set) => {
    return total + calculateIntensityFactor(set.reps);
  }, 0);
  
  return totalIntensity / sets.length;
}

/**
 * STEP 3 - Calculate Work Density
 * work_density = total_volume / session_duration_minutes
 * This represents how demanding the session actually was
 */
export function calculateWorkDensity(totalVolume: number, durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  return totalVolume / durationMinutes;
}

/**
 * STEP 4 - Calculate Base XP from Effort
 * base_xp = (sqrt(relative_volume) × VOLUME_COEFFICIENT + work_density × DENSITY_COEFFICIENT + session_duration_minutes × DURATION_COEFFICIENT) × intensity_factor
 * 
 * relative_volume = total_volume / bodyweight_kg
 * 
 * Properties:
 * - XP represents relative effort, not absolute load
 * - Bodyweight normalizes volume to make progression fair across body sizes
 * - Heavy + dense workouts score higher
 * - Long but lazy sessions score lower
 * - No single variable dominates
 */
export function calculateBaseXP(
  totalVolume: number,
  workDensity: number,
  durationMinutes: number,
  intensityFactor: number,
  bodyweightKg: number
): number {
  // Calculate relative volume (bodyweight-normalized)
  const relativeVolume = totalVolume / bodyweightKg;
  
  const volumeComponent = Math.sqrt(relativeVolume) * VOLUME_COEFFICIENT;
  const densityComponent = workDensity * DENSITY_COEFFICIENT;
  const durationComponent = durationMinutes * DURATION_COEFFICIENT;
  
  return (volumeComponent + densityComponent + durationComponent) * intensityFactor;
}

/**
 * STEP 5 - Apply Fatigue Efficiency Modifier
 * Hard training while exhausted is less effective
 */
export function getFatigueModifier(fatigueLevel: number): number {
  if (fatigueLevel < 40) return 1.0;
  if (fatigueLevel < 60) return 0.85;
  if (fatigueLevel < 80) return 0.7;
  return 0.55; // fatigue >= 80
}

/**
 * STEP 6 - Apply Consistency Bonus
 * Rewards regular training but caps at 1.25
 */
export function getConsistencyMultiplier(sessionsThisWeek: number): number {
  if (sessionsThisWeek >= 5) return 1.25;
  if (sessionsThisWeek === 4) return 1.2;
  if (sessionsThisWeek === 3) return 1.1;
  return 1.0; // 1-2 sessions
}

/**
 * STEP 7 - Apply XP Bounds
 * Minimum: 20 XP per completed session
 * Maximum: 120 XP per session
 */
export function applyXPBounds(xp: number): number {
  return Math.max(20, Math.min(120, Math.round(xp)));
}

/**
 * Main XP Calculation Function
 * Combines all steps to calculate final XP for a workout session
 * 
 * Bodyweight normalization ensures:
 * - A 60kg lifter lifting 3,000kg
 * - A 90kg lifter lifting 4,500kg
 * Can earn similar XP if relative effort is comparable
 */
export function calculateSessionXP(
  workoutData: WorkoutData,
  fatigueData: FatigueData = { fatigue_level: 0 },
  consistencyData: ConsistencyData = { sessions_this_week: 0 },
  bodyweightData: BodyweightData = {}
): number {
  // Validate completion requirements - only check for valid duration and volume
  if (workoutData.duration_minutes <= 0) {
    return 0; // Session must have positive duration
  }
  
  const totalVolume = calculateTotalVolume(workoutData.sets);
  if (totalVolume <= 0) {
    return 0; // Session must have volume
  }
  
  // Apply bodyweight normalization with clamping
  const effectiveBodyweight = clampBodyweight(bodyweightData.bodyweight_kg);
  
  // STEP 1 & 2: Calculate volume and intensity
  const intensityFactor = calculateAverageIntensity(workoutData.sets);
  
  // STEP 3: Calculate work density
  const workDensity = calculateWorkDensity(totalVolume, workoutData.duration_minutes);
  
  // STEP 4: Calculate base XP with bodyweight normalization
  let xp = calculateBaseXP(totalVolume, workDensity, workoutData.duration_minutes, intensityFactor, effectiveBodyweight);
  
  // STEP 5: Apply fatigue modifier
  const fatigueModifier = getFatigueModifier(fatigueData.fatigue_level);
  xp *= fatigueModifier;
  
  // STEP 6: Apply consistency bonus
  const consistencyMultiplier = getConsistencyMultiplier(consistencyData.sessions_this_week);
  xp *= consistencyMultiplier;
  
  // STEP 8: Apply edit penalty if session was edited
  if (workoutData.is_edited) {
    xp *= 0.8;
  }
  
  // STEP 7: Apply bounds
  return applyXPBounds(xp);
}

/**
 * Get a system message based on XP earned
 */
export function getSystemMessage(xp: number): string {
  if (xp >= 100) {
    return "Exceptional training stress detected. Maximum adaptation stimulus achieved.";
  } else if (xp >= 70) {
    return "Significant training load registered. Adaptation in progress.";
  } else if (xp >= 45) {
    return "Training stress registered. Adaptation in progress.";
  } else {
    return "Recovery session logged. Maintaining baseline adaptation.";
  }
}

/**
 * Classify workout type based on XP
 */
export function classifyWorkout(xp: number): string {
  if (xp >= 100) return "Very intense session";
  if (xp >= 70) return "Heavy compound day";
  if (xp >= 45) return "Normal hypertrophy";
  return "Light / recovery";
}
