/**
 * Constants for the Skills system
 */

export const CHARACTERISTIC_ICONS = [
  "⭐", "💪", "🧠", "❤️", "⚡", 
  "🎯", "🛡️", "⚔️", "🏃", "🎨"
] as const;

export const SKILL_AREAS = [
  "Programming",
  "Music",
  "Fitness",
  "Art",
  "Languages",
  "Business",
  "Science",
  "Writing",
] as const;

/**
 * Level progression formula constants
 * Level = floor(sqrt(XP / 100)) + 1
 * 
 * XP Thresholds:
 * Level 1: 0-99 XP
 * Level 2: 100-399 XP
 * Level 3: 400-899 XP
 * Level 4: 900-1599 XP
 * Level 5: 1600-2499 XP
 * Level 10: 8100-9999 XP
 * Level 20: 36100-40099 XP
 */
export const XP_LEVEL_MULTIPLIER = 100;
