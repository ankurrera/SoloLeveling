import { describe, it, expect } from "vitest";
import {
  computeCoreMetricXP,
  computeAllCoreMetrics,
  getRadarChartData,
  calculateMetricLevel,
  getSkillMetricContributions,
  calculateBalanceScore,
  getTotalMetricXP,
  getAverageMetricLevel,
  SkillContributionData,
  CharacteristicContributionData,
} from "../lib/coreMetricCalculation";
import {
  PHYSICAL_BALANCE_METRICS,
  validateContributionWeights,
  normalizeContributionWeights,
  getDefaultMapping,
  MAX_METRIC_XP,
} from "../lib/coreMetrics";

describe("Core Metrics - Constants", () => {
  it("should have exactly 18 Physical Balance metrics", () => {
    expect(PHYSICAL_BALANCE_METRICS.length).toBe(18);
  });

  it("should have all required metric names", () => {
    const expectedMetrics = [
      "Programming", "Learning", "Erudition", "Discipline",
      "Productivity", "Foreign Language", "Fitness", "Drawing",
      "Hygiene", "Reading", "Communication", "Cooking",
      "Meditation", "Swimming", "Running", "Math", "Music", "Cleaning"
    ];
    expect(PHYSICAL_BALANCE_METRICS).toEqual(expectedMetrics);
  });

  it("should have MAX_METRIC_XP set to 2000", () => {
    expect(MAX_METRIC_XP).toBe(2000);
  });
});

describe("Core Metrics - Contribution Weight Validation", () => {
  it("should validate weights that sum to less than 1", () => {
    expect(validateContributionWeights({ Programming: 0.5, Math: 0.3 })).toBe(true);
  });

  it("should validate weights that sum to exactly 1", () => {
    expect(validateContributionWeights({ Programming: 0.6, Math: 0.4 })).toBe(true);
  });

  it("should reject weights that sum to more than 1", () => {
    expect(validateContributionWeights({ Programming: 0.6, Math: 0.5 })).toBe(false);
  });

  it("should normalize weights that exceed 1", () => {
    const normalized = normalizeContributionWeights({ Programming: 0.6, Math: 0.6 });
    expect(normalized.Programming).toBeCloseTo(0.5, 5);
    expect(normalized.Math).toBeCloseTo(0.5, 5);
  });
});

describe("Core Metrics - Default Mappings", () => {
  it("should return Programming mapping for Programming area", () => {
    const mapping = getDefaultMapping("Programming");
    expect(mapping.Programming).toBe(0.8);
    expect(mapping.Math).toBe(0.1);
    expect(mapping.Productivity).toBe(0.1);
  });

  it("should return Learning-based fallback for unknown areas", () => {
    const mapping = getDefaultMapping("UnknownArea");
    expect(mapping.Learning).toBeDefined();
    expect(mapping.Discipline).toBeDefined();
  });

  it("should return Learning-based fallback for null areas", () => {
    const mapping = getDefaultMapping(null);
    expect(mapping.Learning).toBeDefined();
  });
});

describe("Core Metrics - Level Calculation", () => {
  it("should calculate level 1 for 0-99 XP", () => {
    expect(calculateMetricLevel(0)).toBe(1);
    expect(calculateMetricLevel(50)).toBe(1);
    expect(calculateMetricLevel(99)).toBe(1);
  });

  it("should calculate level 2 for 100-399 XP", () => {
    expect(calculateMetricLevel(100)).toBe(2);
    expect(calculateMetricLevel(200)).toBe(2);
    expect(calculateMetricLevel(399)).toBe(2);
  });

  it("should calculate level 3 for 400-899 XP", () => {
    expect(calculateMetricLevel(400)).toBe(3);
    expect(calculateMetricLevel(600)).toBe(3);
    expect(calculateMetricLevel(899)).toBe(3);
  });

  it("should calculate level 5 for 1600-2499 XP", () => {
    expect(calculateMetricLevel(1600)).toBe(5);
    expect(calculateMetricLevel(2000)).toBe(5);
  });
});

describe("Core Metrics - XP Computation", () => {
  it("should compute 0 XP for metric with no contributors", () => {
    const skills: SkillContributionData[] = [];
    const result = computeCoreMetricXP("Programming", skills);
    
    expect(result.xp).toBe(0);
    expect(result.contributions.length).toBe(0);
    expect(result.level).toBe(1);
  });

  it("should compute XP from a single skill with explicit mapping", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Python Learning",
        xp: 500,
        area: null,
        contributesTo: { Programming: 0.8, Math: 0.2 },
      },
    ];
    
    const result = computeCoreMetricXP("Programming", skills);
    
    // 500 XP * 0.8 weight = 400 XP
    expect(result.xp).toBe(400);
    expect(result.contributions.length).toBe(1);
    expect(result.contributions[0].contributedXp).toBe(400);
    expect(result.contributions[0].weight).toBe(0.8);
    expect(result.level).toBe(3); // Level 3 for 400 XP
  });

  it("should compute XP from multiple skills", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Python",
        xp: 500,
        area: null,
        contributesTo: { Programming: 0.5 },
      },
      {
        id: "skill-2",
        name: "JavaScript",
        xp: 300,
        area: null,
        contributesTo: { Programming: 0.6 },
      },
    ];
    
    const result = computeCoreMetricXP("Programming", skills);
    
    // (500 * 0.5) + (300 * 0.6) = 250 + 180 = 430
    expect(result.xp).toBe(430);
    expect(result.contributions.length).toBe(2);
  });

  it("should use default mapping when skill has no explicit contributesTo", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Coding Practice",
        xp: 1000,
        area: "Programming", // Will use default Programming mapping
      },
    ];
    
    const result = computeCoreMetricXP("Programming", skills);
    
    // 1000 XP * 0.8 (default for Programming area) = 800 XP
    expect(result.xp).toBe(800);
    expect(result.contributions[0].weight).toBe(0.8);
  });

  it("should include characteristics in XP computation", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Code Review",
        xp: 200,
        area: null,
        contributesTo: { Programming: 0.5 },
      },
    ];
    
    const characteristics: CharacteristicContributionData[] = [
      {
        id: "char-1",
        name: "Technical Focus",
        xp: 300,
        contributesTo: { Programming: 0.5 },
      },
    ];
    
    const result = computeCoreMetricXP("Programming", skills, characteristics);
    
    // (200 * 0.5) + (300 * 0.5) = 100 + 150 = 250
    expect(result.xp).toBe(250);
    expect(result.contributions.length).toBe(2);
  });
});

describe("Core Metrics - Compute All Metrics", () => {
  it("should compute all 18 metrics", () => {
    const skills: SkillContributionData[] = [];
    const result = computeAllCoreMetrics(skills);
    
    expect(result.length).toBe(18);
  });

  it("should distribute XP across relevant metrics based on mappings", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Full Stack Dev",
        xp: 1000,
        area: null,
        contributesTo: { 
          Programming: 0.4, 
          Productivity: 0.3,
          Learning: 0.3,
        },
      },
    ];
    
    const result = computeAllCoreMetrics(skills);
    
    const programming = result.find(m => m.name === "Programming");
    const productivity = result.find(m => m.name === "Productivity");
    const learning = result.find(m => m.name === "Learning");
    const fitness = result.find(m => m.name === "Fitness");
    
    expect(programming?.xp).toBe(400);
    expect(productivity?.xp).toBe(300);
    expect(learning?.xp).toBe(300);
    expect(fitness?.xp).toBe(0); // No contribution to Fitness
  });
});

describe("Core Metrics - Radar Chart Data", () => {
  it("should return radar data in correct format", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Test Skill",
        xp: 500,
        area: null,
        contributesTo: { Programming: 1.0 },
      },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    expect(radarData.length).toBe(18);
    expect(radarData[0]).toHaveProperty("label");
    expect(radarData[0]).toHaveProperty("value");
    expect(radarData[0].label).toBe("Programming");
    expect(radarData[0].value).toBe(500);
  });

  it("should clamp values to MAX_METRIC_XP", () => {
    const skills: SkillContributionData[] = [
      {
        id: "skill-1",
        name: "Expert Coder",
        xp: 5000, // Very high XP
        area: null,
        contributesTo: { Programming: 1.0 },
      },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    const programming = radarData.find(d => d.label === "Programming");
    // Should be clamped to 2000
    expect(programming?.value).toBe(2000);
  });
});

describe("Core Metrics - Skill Metric Contributions", () => {
  it("should return which metrics a skill contributes to", () => {
    const skill: SkillContributionData = {
      id: "skill-1",
      name: "Algorithm Study",
      xp: 600,
      area: null,
      contributesTo: { 
        Programming: 0.5, 
        Math: 0.3, 
        Learning: 0.2 
      },
    };
    
    const contributions = getSkillMetricContributions(skill);
    
    expect(contributions.length).toBe(3);
    expect(contributions[0].metricName).toBe("Programming"); // Highest weight first
    expect(contributions[0].weight).toBe(0.5);
    expect(contributions[0].contributedXp).toBe(300); // 600 * 0.5
    expect(contributions[1].metricName).toBe("Math");
    expect(contributions[1].contributedXp).toBe(180); // 600 * 0.3
  });
});

describe("Core Metrics - Balance Score", () => {
  it("should return 0 for no metrics", () => {
    expect(calculateBalanceScore([])).toBe(0);
  });

  it("should return 0 for all zero XP", () => {
    const metrics = PHYSICAL_BALANCE_METRICS.map(name => ({
      id: name,
      name,
      xp: 0,
      level: 1,
      contributions: [],
    }));
    
    expect(calculateBalanceScore(metrics)).toBe(0);
  });

  it("should return 100 for perfectly balanced metrics", () => {
    const metrics = PHYSICAL_BALANCE_METRICS.map(name => ({
      id: name,
      name,
      xp: 500, // All equal
      level: 3,
      contributions: [],
    }));
    
    expect(calculateBalanceScore(metrics)).toBe(100);
  });

  it("should return lower score for imbalanced metrics", () => {
    const metrics = PHYSICAL_BALANCE_METRICS.map((name, i) => ({
      id: name,
      name,
      xp: i === 0 ? 1000 : 0, // Only first metric has XP
      level: i === 0 ? 4 : 1,
      contributions: [],
    }));
    
    const score = calculateBalanceScore(metrics);
    expect(score).toBeLessThan(50);
  });
});

describe("Core Metrics - Aggregate Stats", () => {
  it("should calculate total XP correctly", () => {
    const metrics = PHYSICAL_BALANCE_METRICS.map((name, i) => ({
      id: name,
      name,
      xp: 100,
      level: 2,
      contributions: [],
    }));
    
    expect(getTotalMetricXP(metrics)).toBe(1800); // 18 * 100
  });

  it("should calculate average level correctly", () => {
    const metrics = PHYSICAL_BALANCE_METRICS.map(name => ({
      id: name,
      name,
      xp: 400, // Level 3
      level: 3,
      contributions: [],
    }));
    
    expect(getAverageMetricLevel(metrics)).toBe(3);
  });
});

describe("Core Metrics - NON-NEGOTIABLE PRINCIPLES", () => {
  it("PRINCIPLE: Skills do NOT directly draw the radar - XP is mapped through Core Metrics", () => {
    // Skills provide XP
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Skill A", xp: 500, area: null, contributesTo: { Programming: 0.5 } },
    ];
    
    // Core Metrics compute XP from skills
    const metrics = computeAllCoreMetrics(skills);
    
    // Radar reads only from Core Metrics
    const radarData = getRadarChartData(metrics);
    
    // Verify the data flow: Skill XP -> Core Metric XP -> Radar
    const programmingMetric = metrics.find(m => m.name === "Programming");
    const radarProgramming = radarData.find(d => d.label === "Programming");
    
    expect(programmingMetric?.xp).toBe(250); // Skill XP * weight
    expect(radarProgramming?.value).toBe(programmingMetric?.xp);
  });

  it("PRINCIPLE: Core Metric XP is computed, not stored manually", () => {
    // Creating skills with XP
    const skills: SkillContributionData[] = [
      { id: "s1", name: "A", xp: 100, area: null, contributesTo: { Fitness: 0.5 } },
      { id: "s2", name: "B", xp: 200, area: null, contributesTo: { Fitness: 0.5 } },
    ];
    
    // Compute Core Metric XP
    const metric = computeCoreMetricXP("Fitness", skills);
    
    // Verify it's computed as: Σ (Skill XP × Contribution Weight)
    expect(metric.xp).toBe(100 * 0.5 + 200 * 0.5); // 150
    
    // The XP is derived, not set directly
    expect(metric.contributions.length).toBe(2);
    expect(metric.contributions.reduce((sum, c) => sum + c.contributedXp, 0)).toBe(150);
  });

  it("PRINCIPLE: One skill can affect multiple metrics", () => {
    const skill: SkillContributionData = {
      id: "multi-skill",
      name: "Cross Training",
      xp: 1000,
      area: null,
      contributesTo: {
        Fitness: 0.3,
        Discipline: 0.3,
        Running: 0.2,
        Swimming: 0.2,
      },
    };
    
    const metrics = computeAllCoreMetrics([skill]);
    
    expect(metrics.find(m => m.name === "Fitness")?.xp).toBe(300);
    expect(metrics.find(m => m.name === "Discipline")?.xp).toBe(300);
    expect(metrics.find(m => m.name === "Running")?.xp).toBe(200);
    expect(metrics.find(m => m.name === "Swimming")?.xp).toBe(200);
  });

  it("PRINCIPLE: Metrics can receive XP from multiple skills", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Cardio", xp: 400, area: null, contributesTo: { Fitness: 0.5 } },
      { id: "s2", name: "Weights", xp: 600, area: null, contributesTo: { Fitness: 0.5 } },
      { id: "s3", name: "Yoga", xp: 200, area: null, contributesTo: { Fitness: 0.5 } },
    ];
    
    const metric = computeCoreMetricXP("Fitness", skills);
    
    // Total: (400 * 0.5) + (600 * 0.5) + (200 * 0.5) = 200 + 300 + 100 = 600
    expect(metric.xp).toBe(600);
    expect(metric.contributions.length).toBe(3);
  });
});
