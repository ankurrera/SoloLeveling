/**
 * Skill ↔ Core Metrics Synchronization Tests
 * 
 * These tests verify that:
 * 1. Skills are the ONLY entities that gain XP directly
 * 2. Core Metrics derive XP ONLY from Skills
 * 3. Radar chart reads ONLY Core Metric XP
 * 
 * HARD OVERRIDE LINE:
 * "If the Physical Balance radar chart does not update immediately from Skill XP changes, 
 * the implementation is incorrect."
 */

import { describe, it, expect } from "vitest";
import {
  computeCoreMetricXP,
  computeAllCoreMetrics,
  getRadarChartData,
  getSkillMetricContributions,
  SkillContributionData,
} from "../lib/coreMetricCalculation";
import {
  PHYSICAL_BALANCE_METRICS,
  MAX_METRIC_XP,
  getDefaultMapping,
  validateContributionWeights,
  CoreMetricName,
} from "../lib/coreMetrics";

describe("Single Source of Truth - Skills are the only XP source", () => {
  it("skills with 0 XP should result in 0 Core Metric XP", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Empty Skill", xp: 0, area: "Programming" },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const totalXp = metrics.reduce((sum, m) => sum + m.xp, 0);
    
    expect(totalXp).toBe(0);
  });

  it("Core Metric XP is always derived from skills, never stored independently", () => {
    const skillsV1: SkillContributionData[] = [
      { id: "s1", name: "Skill A", xp: 100, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    const skillsV2: SkillContributionData[] = [
      { id: "s1", name: "Skill A", xp: 200, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    // Compute metrics for first version
    const metricsV1 = computeAllCoreMetrics(skillsV1);
    const programmingV1 = metricsV1.find(m => m.name === "Programming");
    
    // Compute metrics for second version
    const metricsV2 = computeAllCoreMetrics(skillsV2);
    const programmingV2 = metricsV2.find(m => m.name === "Programming");
    
    // V2 should reflect the new XP immediately
    expect(programmingV1?.xp).toBe(100);
    expect(programmingV2?.xp).toBe(200);
  });
});

describe("Live Data Flow - Skill XP → Core Metric XP → Radar", () => {
  it("radar data updates immediately when skill XP changes", () => {
    // Initial skill with 500 XP
    const skillsBefore: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8, Learning: 0.2 } },
    ];
    
    // Skill after XP increase (e.g., from attendance)
    const skillsAfter: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 600, area: null, contributesTo: { Programming: 0.8, Learning: 0.2 } },
    ];
    
    const radarBefore = getRadarChartData(computeAllCoreMetrics(skillsBefore));
    const radarAfter = getRadarChartData(computeAllCoreMetrics(skillsAfter));
    
    const programmingBefore = radarBefore.find(d => d.label === "Programming")?.value || 0;
    const programmingAfter = radarAfter.find(d => d.label === "Programming")?.value || 0;
    
    // Radar should immediately reflect the XP change
    expect(programmingBefore).toBe(400); // 500 * 0.8
    expect(programmingAfter).toBe(480); // 600 * 0.8
    expect(programmingAfter).toBeGreaterThan(programmingBefore);
  });

  it("radar updates when a new skill is added", () => {
    const skillsBefore: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8 } },
    ];
    
    const skillsAfter: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8 } },
      { id: "s2", name: "JavaScript", xp: 300, area: null, contributesTo: { Programming: 0.6 } },
    ];
    
    const radarBefore = getRadarChartData(computeAllCoreMetrics(skillsBefore));
    const radarAfter = getRadarChartData(computeAllCoreMetrics(skillsAfter));
    
    const programmingBefore = radarBefore.find(d => d.label === "Programming")?.value || 0;
    const programmingAfter = radarAfter.find(d => d.label === "Programming")?.value || 0;
    
    // Adding a skill should immediately increase the metric
    expect(programmingBefore).toBe(400); // 500 * 0.8
    expect(programmingAfter).toBe(580); // (500 * 0.8) + (300 * 0.6)
  });

  it("radar updates when a skill is deleted", () => {
    const skillsBefore: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8 } },
      { id: "s2", name: "JavaScript", xp: 300, area: null, contributesTo: { Programming: 0.6 } },
    ];
    
    // Remove JavaScript skill
    const skillsAfter: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8 } },
    ];
    
    const radarBefore = getRadarChartData(computeAllCoreMetrics(skillsBefore));
    const radarAfter = getRadarChartData(computeAllCoreMetrics(skillsAfter));
    
    const programmingBefore = radarBefore.find(d => d.label === "Programming")?.value || 0;
    const programmingAfter = radarAfter.find(d => d.label === "Programming")?.value || 0;
    
    // Deleting a skill should immediately remove its XP contribution
    expect(programmingBefore).toBe(580); // (500 * 0.8) + (300 * 0.6)
    expect(programmingAfter).toBe(400); // 500 * 0.8
    expect(programmingAfter).toBeLessThan(programmingBefore);
  });

  it("radar updates when skill mapping is changed", () => {
    const skillsBefore: SkillContributionData[] = [
      { id: "s1", name: "Cross Training", xp: 1000, area: null, contributesTo: { Fitness: 0.5, Running: 0.5 } },
    ];
    
    // Change mapping to favor Programming instead
    const skillsAfter: SkillContributionData[] = [
      { id: "s1", name: "Cross Training", xp: 1000, area: null, contributesTo: { Programming: 0.7, Math: 0.3 } },
    ];
    
    const metricsBefore = computeAllCoreMetrics(skillsBefore);
    const metricsAfter = computeAllCoreMetrics(skillsAfter);
    
    // Before: Fitness and Running should have XP
    expect(metricsBefore.find(m => m.name === "Fitness")?.xp).toBe(500);
    expect(metricsBefore.find(m => m.name === "Running")?.xp).toBe(500);
    expect(metricsBefore.find(m => m.name === "Programming")?.xp).toBe(0);
    
    // After: Programming and Math should have XP, Fitness and Running should have 0
    expect(metricsAfter.find(m => m.name === "Fitness")?.xp).toBe(0);
    expect(metricsAfter.find(m => m.name === "Running")?.xp).toBe(0);
    expect(metricsAfter.find(m => m.name === "Programming")?.xp).toBe(700);
    expect(metricsAfter.find(m => m.name === "Math")?.xp).toBe(300);
  });
});

describe("Skill → Metric Mapping Requirements", () => {
  it("one skill can affect multiple metrics", () => {
    const skill: SkillContributionData = {
      id: "multi-skill",
      name: "Full Stack Dev",
      xp: 1000,
      area: null,
      contributesTo: {
        Programming: 0.4,
        Productivity: 0.3,
        Learning: 0.2,
        Math: 0.1,
      },
    };
    
    const contributions = getSkillMetricContributions(skill);
    
    expect(contributions.length).toBe(4);
    expect(contributions.find(c => c.metricName === "Programming")?.contributedXp).toBe(400);
    expect(contributions.find(c => c.metricName === "Productivity")?.contributedXp).toBe(300);
    expect(contributions.find(c => c.metricName === "Learning")?.contributedXp).toBe(200);
    expect(contributions.find(c => c.metricName === "Math")?.contributedXp).toBe(100);
  });

  it("multiple skills can affect the same metric", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8 } },
      { id: "s2", name: "JavaScript", xp: 400, area: null, contributesTo: { Programming: 0.7 } },
      { id: "s3", name: "Rust", xp: 200, area: null, contributesTo: { Programming: 0.9 } },
    ];
    
    const programming = computeCoreMetricXP("Programming", skills);
    
    // Total: (500 * 0.8) + (400 * 0.7) + (200 * 0.9) = 400 + 280 + 180 = 860
    expect(programming.xp).toBe(860);
    expect(programming.contributions.length).toBe(3);
  });

  it("weights are decimals between 0 and 1", () => {
    // Valid weights
    expect(validateContributionWeights({ Programming: 0.5, Math: 0.3 })).toBe(true);
    expect(validateContributionWeights({ Programming: 1.0 })).toBe(true);
    expect(validateContributionWeights({ Programming: 0.1, Math: 0.1, Learning: 0.1 })).toBe(true);
    
    // Invalid weights (sum > 1)
    expect(validateContributionWeights({ Programming: 0.6, Math: 0.6 })).toBe(false);
  });

  it("Metric XP = sum of all weighted skill XP", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Skill 1", xp: 100, area: null, contributesTo: { Fitness: 0.5 } },
      { id: "s2", name: "Skill 2", xp: 200, area: null, contributesTo: { Fitness: 0.3 } },
      { id: "s3", name: "Skill 3", xp: 300, area: null, contributesTo: { Fitness: 0.4 } },
    ];
    
    const fitness = computeCoreMetricXP("Fitness", skills);
    
    // Formula: Σ (Skill XP × Contribution Weight)
    // (100 * 0.5) + (200 * 0.3) + (300 * 0.4) = 50 + 60 + 120 = 230
    expect(fitness.xp).toBe(230);
  });
});

describe("Radar Chart Requirements", () => {
  it("radar uses MAX_METRIC_XP of 2000", () => {
    expect(MAX_METRIC_XP).toBe(2000);
  });

  it("radar values are clamped to MAX_METRIC_XP", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Super Skill", xp: 5000, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    const radarData = getRadarChartData(computeAllCoreMetrics(skills));
    const programming = radarData.find(d => d.label === "Programming");
    
    // Should be clamped to 2000
    expect(programming?.value).toBe(2000);
  });

  it("radar has exactly 18 data points for all PHYSICAL_BALANCE_METRICS", () => {
    const skills: SkillContributionData[] = [];
    const radarData = getRadarChartData(computeAllCoreMetrics(skills));
    
    expect(radarData.length).toBe(18);
    expect(PHYSICAL_BALANCE_METRICS.length).toBe(18);
  });

  it("each radar point has label and value properties", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Test", xp: 100, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    const radarData = getRadarChartData(computeAllCoreMetrics(skills));
    
    radarData.forEach(point => {
      expect(point).toHaveProperty("label");
      expect(point).toHaveProperty("value");
      expect(typeof point.label).toBe("string");
      expect(typeof point.value).toBe("number");
    });
  });
});

describe("Default Mapping Fallback", () => {
  it("skills without explicit contributesTo use area-based defaults", () => {
    const skill: SkillContributionData = {
      id: "s1",
      name: "Code Practice",
      xp: 1000,
      area: "Programming",
      // No contributesTo - should use default Programming mapping
    };
    
    const contributions = getSkillMetricContributions(skill);
    
    // Default Programming mapping: Programming: 0.8, Math: 0.1, Productivity: 0.1
    expect(contributions.find(c => c.metricName === "Programming")?.weight).toBe(0.8);
    expect(contributions.find(c => c.metricName === "Math")?.weight).toBe(0.1);
    expect(contributions.find(c => c.metricName === "Productivity")?.weight).toBe(0.1);
  });

  it("skills with unknown area use Learning fallback", () => {
    const skill: SkillContributionData = {
      id: "s1",
      name: "Unknown Skill",
      xp: 500,
      area: "UnknownArea",
    };
    
    const contributions = getSkillMetricContributions(skill);
    
    // Default fallback: Learning: 0.5, Discipline: 0.3, Productivity: 0.2
    expect(contributions.find(c => c.metricName === "Learning")?.weight).toBe(0.5);
    expect(contributions.find(c => c.metricName === "Discipline")?.weight).toBe(0.3);
    expect(contributions.find(c => c.metricName === "Productivity")?.weight).toBe(0.2);
  });
});

describe("Bi-directional Debugging Requirements", () => {
  it("can get which skills contribute to a specific metric", () => {
    const skills: SkillContributionData[] = [
      { id: "s1", name: "Python", xp: 500, area: null, contributesTo: { Programming: 0.8, Math: 0.2 } },
      { id: "s2", name: "JS", xp: 300, area: null, contributesTo: { Programming: 0.6 } },
      { id: "s3", name: "Fitness", xp: 400, area: null, contributesTo: { Fitness: 1.0 } },
    ];
    
    const programming = computeCoreMetricXP("Programming", skills);
    
    // Should show 2 contributing skills (Python and JS)
    expect(programming.contributions.length).toBe(2);
    expect(programming.contributions.find(c => c.skillName === "Python")?.contributedXp).toBe(400);
    expect(programming.contributions.find(c => c.skillName === "JS")?.contributedXp).toBe(180);
  });

  it("can get which metrics a skill affects", () => {
    const skill: SkillContributionData = {
      id: "s1",
      name: "Cross Training",
      xp: 1000,
      area: null,
      contributesTo: {
        Fitness: 0.4,
        Running: 0.3,
        Swimming: 0.2,
        Discipline: 0.1,
      },
    };
    
    const contributions = getSkillMetricContributions(skill);
    
    // Should show 4 affected metrics
    expect(contributions.length).toBe(4);
    expect(contributions[0].metricName).toBe("Fitness"); // Highest weight first
    expect(contributions[0].contributedXp).toBe(400);
    expect(contributions[1].metricName).toBe("Running");
    expect(contributions[1].contributedXp).toBe(300);
  });

  it("contributions include skill ID, name, XP, weight, and contributed XP", () => {
    const skills: SkillContributionData[] = [
      { id: "skill-123", name: "Test Skill", xp: 500, area: null, contributesTo: { Programming: 0.6 } },
    ];
    
    const programming = computeCoreMetricXP("Programming", skills);
    const contribution = programming.contributions[0];
    
    expect(contribution).toHaveProperty("skillId", "skill-123");
    expect(contribution).toHaveProperty("skillName", "Test Skill");
    expect(contribution).toHaveProperty("skillXp", 500);
    expect(contribution).toHaveProperty("weight", 0.6);
    expect(contribution).toHaveProperty("contributedXp", 300);
  });
});

describe("HARD OVERRIDE LINE - Immediate Radar Updates", () => {
  it("CRITICAL: Radar reflects skill XP changes without any intermediate caching", () => {
    // Simulate a sequence of XP changes
    const xpSequence = [0, 100, 250, 500, 750, 1000, 1500, 2000];
    
    xpSequence.forEach(xp => {
      const skills: SkillContributionData[] = [
        { id: "s1", name: "Skill", xp, area: null, contributesTo: { Programming: 1.0 } },
      ];
      
      const radarData = getRadarChartData(computeAllCoreMetrics(skills));
      const programming = radarData.find(d => d.label === "Programming");
      
      // Radar should always reflect the current XP value
      expect(programming?.value).toBe(Math.min(xp, MAX_METRIC_XP));
    });
  });

  it("CRITICAL: Skill CRUD operations immediately affect radar", () => {
    // CREATE: New skill adds to radar
    let skills: SkillContributionData[] = [];
    let radar = getRadarChartData(computeAllCoreMetrics(skills));
    expect(radar.find(d => d.label === "Programming")?.value).toBe(0);
    
    // ADD skill
    skills = [{ id: "s1", name: "New Skill", xp: 500, area: null, contributesTo: { Programming: 1.0 } }];
    radar = getRadarChartData(computeAllCoreMetrics(skills));
    expect(radar.find(d => d.label === "Programming")?.value).toBe(500);
    
    // UPDATE skill XP
    skills = [{ id: "s1", name: "New Skill", xp: 800, area: null, contributesTo: { Programming: 1.0 } }];
    radar = getRadarChartData(computeAllCoreMetrics(skills));
    expect(radar.find(d => d.label === "Programming")?.value).toBe(800);
    
    // UPDATE skill mapping
    skills = [{ id: "s1", name: "New Skill", xp: 800, area: null, contributesTo: { Fitness: 1.0 } }];
    radar = getRadarChartData(computeAllCoreMetrics(skills));
    expect(radar.find(d => d.label === "Programming")?.value).toBe(0);
    expect(radar.find(d => d.label === "Fitness")?.value).toBe(800);
    
    // DELETE skill
    skills = [];
    radar = getRadarChartData(computeAllCoreMetrics(skills));
    expect(radar.find(d => d.label === "Fitness")?.value).toBe(0);
  });
});
