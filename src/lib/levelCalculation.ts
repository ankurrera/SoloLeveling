/**
 * Calculate level from XP using the formula: Level = floor(sqrt(XP / 100)) + 1
 * This means:
 * - Level 1: 0-99 XP
 * - Level 2: 100-399 XP
 * - Level 3: 400-899 XP
 * - Level 4: 900-1599 XP
 * - And so on...
 */
export const calculateLevelFromXP = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

/**
 * Calculate the XP required for a specific level
 */
export const calculateXPForLevel = (level: number): number => {
  // Inverse of the level formula: XP = (level - 1)^2 * 100
  return Math.pow(level - 1, 2) * 100;
};

/**
 * Calculate XP required for the next level
 */
export const calculateXPForNextLevel = (currentLevel: number): number => {
  return calculateXPForLevel(currentLevel + 1);
};

/**
 * Calculate XP progress for the current level
 * Returns an object with current XP in level, total XP needed for level, and percentage
 */
export const calculateLevelProgress = (xp: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
} => {
  const currentLevel = calculateLevelFromXP(xp);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
  };
};
