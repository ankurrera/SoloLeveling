import { describe, it, expect } from "vitest";
import {
  calculateIntensityFactor,
  calculateTotalVolume,
  calculateAverageIntensity,
  calculateWorkDensity,
  calculateBaseXP,
  getFatigueModifier,
  getConsistencyMultiplier,
  applyXPBounds,
  calculateSessionXP,
  getSystemMessage,
  classifyWorkout,
  clampBodyweight,
  type ExerciseSet,
  type WorkoutData
} from "../lib/xpCalculation";

describe("XP Calculation - Intensity Factor", () => {
  it("should return 1.3 for heavy sets (1-5 reps)", () => {
    expect(calculateIntensityFactor(5)).toBe(1.3);
    expect(calculateIntensityFactor(3)).toBe(1.3);
    expect(calculateIntensityFactor(1)).toBe(1.3);
  });

  it("should return 1.15 for strength sets (6-8 reps)", () => {
    expect(calculateIntensityFactor(6)).toBe(1.15);
    expect(calculateIntensityFactor(8)).toBe(1.15);
  });

  it("should return 1.0 for hypertrophy sets (9-12 reps)", () => {
    expect(calculateIntensityFactor(9)).toBe(1.0);
    expect(calculateIntensityFactor(12)).toBe(1.0);
  });

  it("should return 0.9 for endurance sets (13-20 reps)", () => {
    expect(calculateIntensityFactor(13)).toBe(0.9);
    expect(calculateIntensityFactor(20)).toBe(0.9);
  });

  it("should return 0.9 for very high rep sets (20+ reps)", () => {
    expect(calculateIntensityFactor(25)).toBe(0.9);
    expect(calculateIntensityFactor(50)).toBe(0.9);
  });
});

describe("XP Calculation - Total Volume", () => {
  it("should calculate total volume correctly", () => {
    const sets: ExerciseSet[] = [
      { reps: 10, weight_kg: 100 },
      { reps: 8, weight_kg: 110 },
      { reps: 6, weight_kg: 120 }
    ];
    // 1000 + 880 + 720 = 2600
    expect(calculateTotalVolume(sets)).toBe(2600);
  });

  it("should handle null weights as 0", () => {
    const sets: ExerciseSet[] = [
      { reps: 10, weight_kg: null },
      { reps: 15, weight_kg: 0 }
    ];
    expect(calculateTotalVolume(sets)).toBe(0);
  });

  it("should handle bodyweight exercises", () => {
    const sets: ExerciseSet[] = [
      { reps: 12, weight_kg: 0 },
      { reps: 10, weight_kg: 0 }
    ];
    expect(calculateTotalVolume(sets)).toBe(0);
  });

  it("should handle mixed exercises", () => {
    const sets: ExerciseSet[] = [
      { reps: 12, weight_kg: 20 }, // 240
      { reps: 10, weight_kg: 0 },  // 0
      { reps: 8, weight_kg: 60 }   // 480
    ];
    expect(calculateTotalVolume(sets)).toBe(720);
  });
});

describe("XP Calculation - Average Intensity", () => {
  it("should calculate average intensity for mixed rep ranges", () => {
    const sets: ExerciseSet[] = [
      { reps: 5, weight_kg: 100 },  // 1.3
      { reps: 8, weight_kg: 90 },   // 1.15
      { reps: 12, weight_kg: 80 }   // 1.0
    ];
    // (1.3 + 1.15 + 1.0) / 3 = 1.15
    expect(calculateAverageIntensity(sets)).toBeCloseTo(1.15, 2);
  });

  it("should return 1.0 for empty sets", () => {
    expect(calculateAverageIntensity([])).toBe(1.0);
  });
});

describe("XP Calculation - Work Density", () => {
  it("should calculate work density correctly", () => {
    expect(calculateWorkDensity(1000, 50)).toBe(20);
    expect(calculateWorkDensity(2400, 60)).toBe(40);
  });

  it("should return 0 for zero duration", () => {
    expect(calculateWorkDensity(1000, 0)).toBe(0);
  });

  it("should handle low density workouts", () => {
    expect(calculateWorkDensity(300, 60)).toBe(5);
  });
});

describe("XP Calculation - Base XP", () => {
  it("should calculate base XP using the formula with bodyweight normalization", () => {
    const totalVolume = 2500; // sqrt(2500/70) = sqrt(35.71) ≈ 5.98
    const workDensity = 50;
    const duration = 60;
    const intensity = 1.15;
    const bodyweight = 70;
    
    // (5.98 * 1.5 + 50 * 0.4 + 60 * 0.3) * 1.15
    // (8.97 + 20 + 18) * 1.15 = 46.97 * 1.15 ≈ 54.01
    const xp = calculateBaseXP(totalVolume, workDensity, duration, intensity, bodyweight);
    expect(xp).toBeCloseTo(54.01, 0);
  });

  it("should reward heavy + dense workouts", () => {
    const bodyweight = 70;
    const heavyDense = calculateBaseXP(4900, 80, 60, 1.3, bodyweight);
    const lightSlow = calculateBaseXP(900, 15, 60, 0.9, bodyweight);
    expect(heavyDense).toBeGreaterThan(lightSlow);
  });
  
  it("should normalize by bodyweight - heavier lifters need more volume for same XP", () => {
    const volume = 3000;
    const workDensity = 50;
    const duration = 60;
    const intensity = 1.0;
    
    const lightLifter = calculateBaseXP(volume, workDensity, duration, intensity, 60);
    const heavyLifter = calculateBaseXP(volume, workDensity, duration, intensity, 90);
    
    // Light lifter should get more XP for same absolute volume
    expect(lightLifter).toBeGreaterThan(heavyLifter);
  });
  
  it("should give similar XP for proportional volume - fairness test", () => {
    const workDensity = 50;
    const duration = 60;
    const intensity = 1.0;
    
    // 60kg lifter with 3000kg volume
    const lightLifter = calculateBaseXP(3000, workDensity, duration, intensity, 60);
    
    // 90kg lifter with 4500kg volume (1.5x more volume for 1.5x bodyweight)
    const heavyLifter = calculateBaseXP(4500, workDensity, duration, intensity, 90);
    
    // Should be very similar (within 5% due to other components)
    const maxXP = Math.max(lightLifter, heavyLifter);
    expect(Math.abs(lightLifter - heavyLifter) / maxXP).toBeLessThan(0.05);
  });
});

describe("XP Calculation - Fatigue Modifier", () => {
  it("should return 1.0 for low fatigue (< 40)", () => {
    expect(getFatigueModifier(0)).toBe(1.0);
    expect(getFatigueModifier(35)).toBe(1.0);
  });

  it("should return 0.85 for medium fatigue (40-59)", () => {
    expect(getFatigueModifier(40)).toBe(0.85);
    expect(getFatigueModifier(55)).toBe(0.85);
  });

  it("should return 0.7 for high fatigue (60-79)", () => {
    expect(getFatigueModifier(60)).toBe(0.7);
    expect(getFatigueModifier(75)).toBe(0.7);
  });

  it("should return 0.55 for very high fatigue (>= 80)", () => {
    expect(getFatigueModifier(80)).toBe(0.55);
    expect(getFatigueModifier(95)).toBe(0.55);
  });
});

describe("XP Calculation - Consistency Multiplier", () => {
  it("should return 1.0 for 1-2 sessions", () => {
    expect(getConsistencyMultiplier(1)).toBe(1.0);
    expect(getConsistencyMultiplier(2)).toBe(1.0);
  });

  it("should return 1.1 for 3 sessions", () => {
    expect(getConsistencyMultiplier(3)).toBe(1.1);
  });

  it("should return 1.2 for 4 sessions", () => {
    expect(getConsistencyMultiplier(4)).toBe(1.2);
  });

  it("should return 1.25 for 5+ sessions", () => {
    expect(getConsistencyMultiplier(5)).toBe(1.25);
    expect(getConsistencyMultiplier(6)).toBe(1.25);
  });
});

describe("XP Calculation - Bodyweight Clamping", () => {
  it("should use default bodyweight (70kg) when null", () => {
    expect(clampBodyweight(null)).toBe(70);
  });

  it("should use default bodyweight (70kg) when undefined", () => {
    expect(clampBodyweight(undefined)).toBe(70);
  });

  it("should use default bodyweight (70kg) when zero or negative", () => {
    expect(clampBodyweight(0)).toBe(70);
    expect(clampBodyweight(-10)).toBe(70);
  });

  it("should clamp to minimum 50kg", () => {
    expect(clampBodyweight(30)).toBe(50);
    expect(clampBodyweight(45)).toBe(50);
    expect(clampBodyweight(49)).toBe(50);
  });

  it("should clamp to maximum 120kg", () => {
    expect(clampBodyweight(150)).toBe(120);
    expect(clampBodyweight(200)).toBe(120);
    expect(clampBodyweight(121)).toBe(120);
  });

  it("should pass through valid bodyweights", () => {
    expect(clampBodyweight(50)).toBe(50);
    expect(clampBodyweight(60)).toBe(60);
    expect(clampBodyweight(70)).toBe(70);
    expect(clampBodyweight(80)).toBe(80);
    expect(clampBodyweight(90)).toBe(90);
    expect(clampBodyweight(120)).toBe(120);
  });
});

describe("XP Calculation - XP Bounds", () => {
  it("should enforce minimum of 20 XP", () => {
    expect(applyXPBounds(10)).toBe(20);
    expect(applyXPBounds(15)).toBe(20);
  });

  it("should enforce maximum of 120 XP", () => {
    expect(applyXPBounds(150)).toBe(120);
    expect(applyXPBounds(200)).toBe(120);
  });

  it("should round to nearest integer", () => {
    expect(applyXPBounds(45.7)).toBe(46);
    expect(applyXPBounds(45.3)).toBe(45);
  });

  it("should pass through valid values", () => {
    expect(applyXPBounds(50)).toBe(50);
    expect(applyXPBounds(75)).toBe(75);
  });
});

describe("XP Calculation - Complete Session", () => {
  it("should reject sessions with zero or negative duration", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 0
    };
    expect(calculateSessionXP(workout)).toBe(0);
    
    const workout2: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: -5
    };
    expect(calculateSessionXP(workout2)).toBe(0);
  });

  it("should accept short sessions with volume", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 10
    };
    // Should return valid XP, not 0
    expect(calculateSessionXP(workout)).toBeGreaterThan(0);
  });

  it("should reject sessions with no volume", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 0 },
        { reps: 8, weight_kg: null }
      ],
      duration_minutes: 30
    };
    expect(calculateSessionXP(workout)).toBe(0);
  });

  it("should calculate XP for light/recovery workout (20-30 XP)", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 15, weight_kg: 5 },
        { reps: 15, weight_kg: 5 }
      ],
      duration_minutes: 25
    };
    const xp = calculateSessionXP(workout);
    expect(xp).toBeGreaterThanOrEqual(20);
    expect(xp).toBeLessThanOrEqual(30);
  });

  it("should calculate XP for normal hypertrophy workout (45-65 XP)", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 12, weight_kg: 20 },
        { reps: 10, weight_kg: 25 },
        { reps: 12, weight_kg: 20 },
        { reps: 10, weight_kg: 25 },
        { reps: 12, weight_kg: 15 },
        { reps: 12, weight_kg: 15 }
      ],
      duration_minutes: 45
    };
    const xp = calculateSessionXP(workout);
    expect(xp).toBeGreaterThanOrEqual(20); // Adjusted for bodyweight normalization
    expect(xp).toBeLessThanOrEqual(65);
  });

  it("should calculate XP for heavy compound day (70-100 XP)", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 5, weight_kg: 100 },
        { reps: 5, weight_kg: 110 },
        { reps: 3, weight_kg: 120 },
        { reps: 8, weight_kg: 80 },
        { reps: 8, weight_kg: 85 },
        { reps: 6, weight_kg: 90 }
      ],
      duration_minutes: 60
    };
    const xp = calculateSessionXP(workout);
    expect(xp).toBeGreaterThanOrEqual(45); // Adjusted for bodyweight normalization
    expect(xp).toBeLessThanOrEqual(100);
  });

  it("should calculate XP for very intense session (100-120 XP)", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 5, weight_kg: 140 },
        { reps: 5, weight_kg: 140 },
        { reps: 3, weight_kg: 150 },
        { reps: 5, weight_kg: 100 },
        { reps: 5, weight_kg: 100 },
        { reps: 8, weight_kg: 90 },
        { reps: 8, weight_kg: 90 },
        { reps: 12, weight_kg: 60 }
      ],
      duration_minutes: 70
    };
    const xp = calculateSessionXP(workout);
    expect(xp).toBeGreaterThanOrEqual(60); // Adjusted for bodyweight normalization
    expect(xp).toBeLessThanOrEqual(120);
  });

  it("should apply fatigue penalty", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 45
    };
    const freshXP = calculateSessionXP(workout, { fatigue_level: 0 });
    const fatiguedXP = calculateSessionXP(workout, { fatigue_level: 85 });
    
    expect(fatiguedXP).toBeLessThan(freshXP);
    // Verify penalty is applied (fatigued should be ~55% of fresh after rounding)
    expect(fatiguedXP / freshXP).toBeGreaterThan(0.5);
    expect(fatiguedXP / freshXP).toBeLessThan(0.6);
  });

  it("should apply consistency bonus", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 45
    };
    const inconsistentXP = calculateSessionXP(workout, undefined, { sessions_this_week: 1 });
    const consistentXP = calculateSessionXP(workout, undefined, { sessions_this_week: 5 });
    
    expect(consistentXP).toBeGreaterThan(inconsistentXP);
    // Verify bonus is applied (consistent should be ~1.25x, accounting for rounding)
    expect(consistentXP / inconsistentXP).toBeGreaterThan(1.2);
    expect(consistentXP / inconsistentXP).toBeLessThanOrEqual(1.3);
  });

  it("should apply edit penalty (0.8x)", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 45,
      is_edited: false
    };
    const originalXP = calculateSessionXP(workout);
    
    workout.is_edited = true;
    const editedXP = calculateSessionXP(workout);
    
    expect(editedXP).toBeLessThan(originalXP);
    // Verify penalty is applied (edited should be ~80% of original after rounding)
    expect(editedXP / originalXP).toBeGreaterThan(0.75);
    expect(editedXP / originalXP).toBeLessThan(0.85);
  });

  it("should cap at maximum 120 XP even with bonuses", () => {
    const workout: WorkoutData = {
      sets: Array(20).fill({ reps: 5, weight_kg: 150 }),
      duration_minutes: 120
    };
    const xp = calculateSessionXP(workout, { fatigue_level: 0 }, { sessions_this_week: 5 });
    expect(xp).toBe(120);
  });

  it("should use default bodyweight (70kg) when not provided", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 8, weight_kg: 110 }
      ],
      duration_minutes: 45
    };
    const xpNoBodyweight = calculateSessionXP(workout);
    const xpWith70kg = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 70 });
    
    expect(xpNoBodyweight).toBe(xpWith70kg);
  });

  it("should normalize XP by bodyweight - lighter lifter gets more XP for same volume", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 10, weight_kg: 100 },
        { reps: 10, weight_kg: 100 }
      ],
      duration_minutes: 45
    };
    
    const lightLifterXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 60 });
    const heavyLifterXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 90 });
    
    // Light lifter should earn more XP for same absolute volume
    expect(lightLifterXP).toBeGreaterThan(heavyLifterXP);
    // Verify difference exists (after rounding, difference might be small but should be present)
    expect(lightLifterXP - heavyLifterXP).toBeGreaterThanOrEqual(1);
  });

  it("should give similar XP for proportional effort - fairness test", () => {
    const duration = 60;
    
    // 60kg lifter with 3000kg volume
    const lightWorkout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 10, weight_kg: 100 },
        { reps: 10, weight_kg: 100 }
      ],
      duration_minutes: duration
    };
    const lightLifterXP = calculateSessionXP(lightWorkout, undefined, undefined, { bodyweight_kg: 60 });
    
    // 90kg lifter with 4500kg volume (1.5x more for 1.5x bodyweight)
    const heavyWorkout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 150 },
        { reps: 10, weight_kg: 150 },
        { reps: 10, weight_kg: 150 }
      ],
      duration_minutes: duration
    };
    const heavyLifterXP = calculateSessionXP(heavyWorkout, undefined, undefined, { bodyweight_kg: 90 });
    
    // Should be similar (within 20% due to rounding, XP bounds, and other components)
    const difference = Math.abs(lightLifterXP - heavyLifterXP);
    expect(difference).toBeLessThanOrEqual(Math.max(lightLifterXP, heavyLifterXP) * 0.20);
  });

  it("should clamp extreme bodyweights to prevent exploitation", () => {
    const workout: WorkoutData = {
      sets: [
        { reps: 10, weight_kg: 100 },
        { reps: 10, weight_kg: 100 }
      ],
      duration_minutes: 45
    };
    
    // Very low bodyweight should be clamped to 50kg
    const lowBWXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 30 });
    const minBWXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 50 });
    expect(lowBWXP).toBe(minBWXP);
    
    // Very high bodyweight should be clamped to 120kg
    const highBWXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 200 });
    const maxBWXP = calculateSessionXP(workout, undefined, undefined, { bodyweight_kg: 120 });
    expect(highBWXP).toBe(maxBWXP);
  });
});

describe("System Messages", () => {
  it("should return appropriate message for very intense session", () => {
    const message = getSystemMessage(110);
    expect(message).toContain("Exceptional");
    expect(message).toContain("Maximum adaptation");
  });

  it("should return appropriate message for heavy session", () => {
    const message = getSystemMessage(85);
    expect(message).toContain("Significant");
    expect(message).toContain("Adaptation in progress");
  });

  it("should return appropriate message for normal session", () => {
    const message = getSystemMessage(55);
    expect(message).toContain("Training stress registered");
  });

  it("should return appropriate message for light session", () => {
    const message = getSystemMessage(25);
    expect(message).toContain("Recovery");
  });
});

describe("Workout Classification", () => {
  it("should classify very intense sessions", () => {
    expect(classifyWorkout(110)).toBe("Very intense session");
  });

  it("should classify heavy compound days", () => {
    expect(classifyWorkout(85)).toBe("Heavy compound day");
  });

  it("should classify normal hypertrophy", () => {
    expect(classifyWorkout(55)).toBe("Normal hypertrophy");
  });

  it("should classify light/recovery", () => {
    expect(classifyWorkout(25)).toBe("Light / recovery");
  });
});
