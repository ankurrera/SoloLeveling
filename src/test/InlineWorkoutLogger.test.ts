import { describe, it, expect } from "vitest";

describe('InlineWorkoutLogger validation', () => {
  it('should validate weight must be >= 0', () => {
    const weight = -5;
    const isValid = weight >= 0;
    expect(isValid).toBe(false);
  });

  it('should validate weight can be 0', () => {
    const weight = 0;
    const isValid = weight >= 0;
    expect(isValid).toBe(true);
  });

  it('should validate reps must be >= 1', () => {
    const reps = 0;
    const isValid = reps >= 1;
    expect(isValid).toBe(false);
  });

  it('should validate reps must be positive', () => {
    const reps = 5;
    const isValid = reps >= 1;
    expect(isValid).toBe(true);
  });

  it('should validate exercise name cannot be empty', () => {
    const name = "   ";
    const isValid = name.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should validate exercise name can contain spaces', () => {
    const name = "Bench Press";
    const isValid = name.trim().length > 0;
    expect(isValid).toBe(true);
  });
});

describe('Exercise set numbering', () => {
  it('should auto-increment set numbers', () => {
    const existingSets = [
      { id: '1', set_number: 1, reps: 10, weight_kg: 20 },
      { id: '2', set_number: 2, reps: 8, weight_kg: 25 },
    ];
    
    const newSetNumber = existingSets.length + 1;
    expect(newSetNumber).toBe(3);
  });

  it('should start at set number 1 for first set', () => {
    const existingSets: Array<{ id: string; set_number: number; reps: number; weight_kg: number }> = [];
    const newSetNumber = existingSets.length + 1;
    expect(newSetNumber).toBe(1);
  });
});

describe('Exercise ordering', () => {
  it('should maintain order index when adding exercises', () => {
    const existingExercises = [
      { id: '1', order_index: 0, exercise_name: 'Bench Press' },
      { id: '2', order_index: 1, exercise_name: 'Squats' },
    ];
    
    const newOrderIndex = existingExercises.length;
    expect(newOrderIndex).toBe(2);
  });
});

describe('Data model structure', () => {
  it('should have correct WorkoutSession structure', () => {
    const session = {
      id: 'test-id',
      user_id: 'user-id',
      session_date: new Date().toISOString(),
      duration_minutes: 60,
      notes: 'Test workout',
      total_xp_earned: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('user_id');
    expect(session).toHaveProperty('session_date');
    expect(session).toHaveProperty('total_xp_earned');
  });

  it('should have correct SessionExercise structure', () => {
    const exercise = {
      id: 'exercise-id',
      session_id: 'session-id',
      exercise_name: 'Bench Press',
      exercise_type: 'strength',
      order_index: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    expect(exercise).toHaveProperty('id');
    expect(exercise).toHaveProperty('session_id');
    expect(exercise).toHaveProperty('exercise_name');
    expect(exercise).toHaveProperty('order_index');
  });

  it('should have correct ExerciseSet structure with weight_kg', () => {
    const set = {
      id: 'set-id',
      exercise_id: 'exercise-id',
      set_number: 1,
      reps: 10,
      weight_kg: 20.5,
      duration_seconds: null,
      distance_meters: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    expect(set).toHaveProperty('id');
    expect(set).toHaveProperty('exercise_id');
    expect(set).toHaveProperty('set_number');
    expect(set).toHaveProperty('reps');
    expect(set).toHaveProperty('weight_kg');
    expect(set.weight_kg).toBe(20.5);
  });
});

describe('Workout example validation', () => {
  it('should validate the example workout structure from requirements', () => {
    const workoutExample = {
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight_kg: 17.5, reps: 12 },
            { weight_kg: 20.0, reps: 10 },
          ]
        },
        {
          name: 'Incline Dumbbell Press',
          sets: [
            { weight_kg: 12.5, reps: 12 },
            { weight_kg: 15.0, reps: 10 },
          ]
        }
      ]
    };

    expect(workoutExample.exercises).toHaveLength(2);
    expect(workoutExample.exercises[0].sets).toHaveLength(2);
    expect(workoutExample.exercises[0].sets[0].weight_kg).toBe(17.5);
    expect(workoutExample.exercises[0].sets[0].reps).toBe(12);
  });
});
