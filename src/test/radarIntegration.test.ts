/**
 * Radar Chart Integration Tests
 * 
 * These tests verify the complete data flow from Skill CRUD operations
 * through Core Metrics computation to Radar Chart rendering.
 * 
 * This validates the HARD OVERRIDE LINE requirement:
 * "Remove all hardcoded radar data and bind the radar exclusively to 
 * computed Core Metrics derived from the Skills store."
 */

import { describe, it, expect } from "vitest";
import {
  computeAllCoreMetrics,
  getRadarChartData,
  SkillContributionData,
  CharacteristicContributionData,
} from "../lib/coreMetricCalculation";
import { PHYSICAL_BALANCE_METRICS, MAX_METRIC_XP } from "../lib/coreMetrics";

describe("Radar Integration - Full CRUD Flow", () => {
  it("simulates complete skill lifecycle: CREATE → UPDATE → DELETE", () => {
    // Initial state: No skills
    let skills: SkillContributionData[] = [];
    let characteristics: CharacteristicContributionData[] = [];
    
    // Compute initial radar
    let metrics = computeAllCoreMetrics(skills, characteristics);
    let radarData = getRadarChartData(metrics);
    
    // Verify initial state: all zeros
    expect(radarData.length).toBe(18);
    expect(radarData.every(d => d.value === 0)).toBe(true);
    
    // ========================================
    // STEP 1: CREATE - Add first skill
    // ========================================
    skills = [
      {
        id: 's1',
        name: 'Python Programming',
        xp: 500,
        area: null,
        contributesTo: { Programming: 0.8, Math: 0.2 },
      },
    ];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify radar immediately reflects new skill
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(400); // 500 * 0.8
    expect(radarData.find(d => d.label === 'Math')?.value).toBe(100); // 500 * 0.2
    
    // Verify debug info
    const programmingMetric = metrics.find(m => m.name === 'Programming');
    expect(programmingMetric?.contributions.length).toBe(1);
    expect(programmingMetric?.contributions[0].skillName).toBe('Python Programming');
    
    // ========================================
    // STEP 2: CREATE - Add second skill
    // ========================================
    skills = [
      ...skills,
      {
        id: 's2',
        name: 'Daily Jogging',
        xp: 800,
        area: null,
        contributesTo: { Running: 0.6, Fitness: 0.4 },
      },
    ];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify both skills are reflected
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(400);
    expect(radarData.find(d => d.label === 'Running')?.value).toBe(480); // 800 * 0.6
    expect(radarData.find(d => d.label === 'Fitness')?.value).toBe(320); // 800 * 0.4
    
    // ========================================
    // STEP 3: UPDATE - Increase skill XP
    // ========================================
    skills = [
      { ...skills[0], xp: 1000 }, // Double Python XP
      skills[1],
    ];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify radar immediately updates
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(800); // 1000 * 0.8
    expect(radarData.find(d => d.label === 'Math')?.value).toBe(200); // 1000 * 0.2
    
    // ========================================
    // STEP 4: UPDATE - Change skill mapping
    // ========================================
    skills = [
      { ...skills[0], contributesTo: { Productivity: 0.5, Learning: 0.5 } }, // Remap Python
      skills[1],
    ];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify old metrics are removed and new ones added
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(0);
    expect(radarData.find(d => d.label === 'Math')?.value).toBe(0);
    expect(radarData.find(d => d.label === 'Productivity')?.value).toBe(500); // 1000 * 0.5
    expect(radarData.find(d => d.label === 'Learning')?.value).toBe(500); // 1000 * 0.5
    
    // ========================================
    // STEP 5: DELETE - Remove first skill
    // ========================================
    skills = [skills[1]]; // Keep only jogging
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify Python contributions are completely removed
    expect(radarData.find(d => d.label === 'Productivity')?.value).toBe(0);
    expect(radarData.find(d => d.label === 'Learning')?.value).toBe(0);
    
    // Verify jogging skill still present
    expect(radarData.find(d => d.label === 'Running')?.value).toBe(480);
    expect(radarData.find(d => d.label === 'Fitness')?.value).toBe(320);
    
    // ========================================
    // STEP 6: DELETE - Remove all skills
    // ========================================
    skills = [];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify radar returns to all zeros
    expect(radarData.every(d => d.value === 0)).toBe(true);
  });

  it("verifies characteristics also contribute to radar without refresh", () => {
    const skills: SkillContributionData[] = [
      {
        id: 's1',
        name: 'Code Practice',
        xp: 600,
        area: null,
        contributesTo: { Programming: 1.0 },
      },
    ];
    
    let characteristics: CharacteristicContributionData[] = [];
    
    // Initial state with just skills
    let metrics = computeAllCoreMetrics(skills, characteristics);
    let radarData = getRadarChartData(metrics);
    
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(600);
    expect(radarData.find(d => d.label === 'Discipline')?.value).toBe(0);
    
    // Add characteristic
    characteristics = [
      {
        id: 'c1',
        name: 'Discipline',
        xp: 400,
        contributesTo: { Discipline: 1.0 },
      },
    ];
    
    metrics = computeAllCoreMetrics(skills, characteristics);
    radarData = getRadarChartData(metrics);
    
    // Verify both skills and characteristics contribute
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(600);
    expect(radarData.find(d => d.label === 'Discipline')?.value).toBe(400);
    
    // Verify contributions are tracked
    const disciplineMetric = metrics.find(m => m.name === 'Discipline');
    expect(disciplineMetric?.contributions.length).toBe(1);
    expect(disciplineMetric?.contributions[0].skillName).toBe('Discipline');
  });

  it("verifies radar data structure integrity after every operation", () => {
    const skills: SkillContributionData[] = [
      { id: 's1', name: 'Skill 1', xp: 100, area: null, contributesTo: { Programming: 1.0 } },
      { id: 's2', name: 'Skill 2', xp: 200, area: null, contributesTo: { Fitness: 0.5, Running: 0.5 } },
      { id: 's3', name: 'Skill 3', xp: 300, area: null, contributesTo: { Reading: 0.3, Learning: 0.7 } },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    // Verify structural integrity
    expect(radarData.length).toBe(PHYSICAL_BALANCE_METRICS.length);
    expect(radarData.length).toBe(18);
    
    // Verify every point has required properties
    radarData.forEach(point => {
      expect(point).toHaveProperty('label');
      expect(point).toHaveProperty('value');
      expect(typeof point.label).toBe('string');
      expect(typeof point.value).toBe('number');
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(MAX_METRIC_XP);
    });
    
    // Verify labels match PHYSICAL_BALANCE_METRICS exactly
    const radarLabels = radarData.map(d => d.label).sort();
    const expectedLabels = [...PHYSICAL_BALANCE_METRICS].sort();
    expect(radarLabels).toEqual(expectedLabels);
  });

  it("CRITICAL: verifies no stale or ghost values after skill deletion", () => {
    // Create multiple skills affecting same metric
    let skills: SkillContributionData[] = [
      { id: 's1', name: 'Python', xp: 500, area: null, contributesTo: { Programming: 1.0 } },
      { id: 's2', name: 'JavaScript', xp: 300, area: null, contributesTo: { Programming: 1.0 } },
      { id: 's3', name: 'Rust', xp: 200, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    let metrics = computeAllCoreMetrics(skills);
    let radarData = getRadarChartData(metrics);
    
    // Initial total: 500 + 300 + 200 = 1000
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(1000);
    
    // Delete middle skill
    skills = [skills[0], skills[2]];
    
    metrics = computeAllCoreMetrics(skills);
    radarData = getRadarChartData(metrics);
    
    // New total: 500 + 200 = 700 (NOT 1000)
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(700);
    
    // Delete all skills
    skills = [];
    
    metrics = computeAllCoreMetrics(skills);
    radarData = getRadarChartData(metrics);
    
    // Must be exactly 0, no ghost values
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(0);
    
    // Verify contributions list is empty
    const programmingMetric = metrics.find(m => m.name === 'Programming');
    expect(programmingMetric?.contributions.length).toBe(0);
  });

  it("CRITICAL: verifies clamping to MAX_METRIC_XP works correctly", () => {
    // Create skill with XP that would exceed MAX_METRIC_XP
    const skills: SkillContributionData[] = [
      { id: 's1', name: 'Master Skill', xp: 5000, area: null, contributesTo: { Programming: 1.0 } },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    // Raw metric should have full XP
    expect(metrics.find(m => m.name === 'Programming')?.xp).toBe(5000);
    
    // Radar should clamp to MAX_METRIC_XP (2000)
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(MAX_METRIC_XP);
    expect(MAX_METRIC_XP).toBe(2000); // Verify constant value
  });

  it("CRITICAL: verifies skill with 0 XP contributes 0 to all metrics", () => {
    const skills: SkillContributionData[] = [
      { id: 's1', name: 'New Skill', xp: 0, area: null, contributesTo: { 
        Programming: 0.3, 
        Learning: 0.3, 
        Productivity: 0.4 
      }},
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    // All metrics should be 0 despite having contribution mappings
    expect(radarData.find(d => d.label === 'Programming')?.value).toBe(0);
    expect(radarData.find(d => d.label === 'Learning')?.value).toBe(0);
    expect(radarData.find(d => d.label === 'Productivity')?.value).toBe(0);
    
    // Total XP across all metrics should be 0
    const totalXp = radarData.reduce((sum, d) => sum + d.value, 0);
    expect(totalXp).toBe(0);
  });

  it("CRITICAL: verifies multiple skills can contribute to same metric additively", () => {
    const skills: SkillContributionData[] = [
      { id: 's1', name: 'Morning Run', xp: 600, area: null, contributesTo: { Running: 0.8, Fitness: 0.2 } },
      { id: 's2', name: 'Evening Run', xp: 400, area: null, contributesTo: { Running: 0.7, Fitness: 0.3 } },
      { id: 's3', name: 'Sprint Training', xp: 300, area: null, contributesTo: { Running: 1.0 } },
    ];
    
    const metrics = computeAllCoreMetrics(skills);
    const radarData = getRadarChartData(metrics);
    
    // Running: (600 * 0.8) + (400 * 0.7) + (300 * 1.0) = 480 + 280 + 300 = 1060
    expect(radarData.find(d => d.label === 'Running')?.value).toBe(1060);
    
    // Fitness: (600 * 0.2) + (400 * 0.3) = 120 + 120 = 240
    expect(radarData.find(d => d.label === 'Fitness')?.value).toBe(240);
    
    // Verify all three skills are tracked in contributions
    const runningMetric = metrics.find(m => m.name === 'Running');
    expect(runningMetric?.contributions.length).toBe(3);
  });
});

describe("Radar Integration - Reactive Updates", () => {
  it("simulates attendance marking increasing skill XP", () => {
    // Skill before attendance
    let skills: SkillContributionData[] = [
      { id: 's1', name: 'Meditation', xp: 200, area: null, contributesTo: { Meditation: 1.0 } },
    ];
    
    let metrics = computeAllCoreMetrics(skills);
    let radarData = getRadarChartData(metrics);
    
    expect(radarData.find(d => d.label === 'Meditation')?.value).toBe(200);
    
    // Simulate attendance marking that adds 50 XP
    skills = [
      { ...skills[0], xp: 250 },
    ];
    
    metrics = computeAllCoreMetrics(skills);
    radarData = getRadarChartData(metrics);
    
    // Radar immediately reflects XP increase
    expect(radarData.find(d => d.label === 'Meditation')?.value).toBe(250);
  });

  it("simulates time edit changing skill XP", () => {
    // Skill with initial XP
    let skills: SkillContributionData[] = [
      { id: 's1', name: 'Guitar', xp: 500, area: null, contributesTo: { Music: 0.8, Discipline: 0.2 } },
    ];
    
    let metrics = computeAllCoreMetrics(skills);
    let radarData = getRadarChartData(metrics);
    
    expect(radarData.find(d => d.label === 'Music')?.value).toBe(400);
    expect(radarData.find(d => d.label === 'Discipline')?.value).toBe(100);
    
    // User edits time, XP recalculates to 700
    skills = [
      { ...skills[0], xp: 700 },
    ];
    
    metrics = computeAllCoreMetrics(skills);
    radarData = getRadarChartData(metrics);
    
    // Radar immediately reflects new XP
    expect(radarData.find(d => d.label === 'Music')?.value).toBe(560);
    expect(radarData.find(d => d.label === 'Discipline')?.value).toBe(140);
  });
});

describe("Radar Integration - Data Consistency", () => {
  it("verifies radar data always matches core metrics count", () => {
    const testCases = [
      { skills: [], expected: 18 },
      { skills: [{ id: 's1', name: 'Test', xp: 100, area: null, contributesTo: { Programming: 1.0 } }], expected: 18 },
      { skills: Array(10).fill(null).map((_, i) => ({
        id: `s${i}`,
        name: `Skill ${i}`,
        xp: 100 * i,
        area: null,
        contributesTo: { Programming: 1.0 },
      })), expected: 18 },
    ];
    
    testCases.forEach(({ skills, expected }) => {
      const metrics = computeAllCoreMetrics(skills as SkillContributionData[]);
      const radarData = getRadarChartData(metrics);
      
      expect(radarData.length).toBe(expected);
      expect(radarData.length).toBe(metrics.length);
      expect(radarData.length).toBe(PHYSICAL_BALANCE_METRICS.length);
    });
  });
});
