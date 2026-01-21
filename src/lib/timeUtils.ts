/**
 * Utility functions for time formatting
 */

/**
 * Format seconds into HH:MM:SS format
 * @param seconds Total elapsed seconds
 * @returns Formatted time string (e.g., "01:23:45")
 */
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds into compact time display (e.g., "1h 23m" or "45m")
 * @param seconds Total elapsed seconds
 * @returns Compact time string
 */
export function formatCompactTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format minutes into hours and minutes (e.g., "2h 30m")
 * @param minutes Total minutes
 * @returns Formatted time string
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}
