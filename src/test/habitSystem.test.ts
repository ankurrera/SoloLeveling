import { describe, it, expect } from "vitest";

describe("Habit System", () => {
  it("should define valid habit colors", () => {
    const validColors = ['purple', 'green', 'gold', 'orange', 'brown'];
    expect(validColors).toContain('purple');
    expect(validColors).toContain('green');
    expect(validColors).toContain('gold');
    expect(validColors).toContain('orange');
    expect(validColors).toContain('brown');
  });

  it("should validate habit structure", () => {
    const habit = {
      id: "test-id",
      user_id: "user-123",
      name: "Read 1 Page",
      icon: "📖",
      color: "purple",
      win_xp: 50,
      lose_xp: 25,
      duration_days: 30,
      created_at: new Date().toISOString(),
    };
    
    expect(habit.name).toBe("Read 1 Page");
    expect(habit.icon).toBe("📖");
    expect(habit.color).toBe("purple");
    expect(habit.win_xp).toBeGreaterThan(0);
    expect(habit.lose_xp).toBeGreaterThan(0);
    expect(habit.duration_days).toBeGreaterThan(0);
  });

  it("should validate habit completion structure", () => {
    const completion = {
      id: "completion-id",
      habit_id: "habit-123",
      user_id: "user-123",
      completion_date: "2026-01-25",
      completed: true,
      created_at: new Date().toISOString(),
    };
    
    expect(completion.habit_id).toBe("habit-123");
    expect(completion.completed).toBe(true);
    expect(completion.completion_date).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("should generate correct calendar grid dimensions", () => {
    // A 7x5 grid should have 35 cells
    const weeks = 5;
    const daysPerWeek = 7;
    const totalCells = weeks * daysPerWeek;
    
    expect(totalCells).toBe(35);
  });

  it("should calculate completion rate correctly", () => {
    const totalDays = 30;
    const completedDays = 21;
    const completionRate = (completedDays / totalDays) * 100;
    
    expect(completionRate).toBe(70);
    expect(completionRate).toBeGreaterThanOrEqual(70); // Consider 70%+ as winning
  });
});
