import { useEffect, useRef, useState, useCallback } from "react";
import { useSkills } from "@/hooks/useSkills";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Physical Balance Radar Chart Component
 * 
 * CORE PRINCIPLE (NON-NEGOTIABLE):
 * - Radar reads DIRECTLY from Skills
 * - Each Skill = One Radar Axis
 * - No aggregation, no grouping, no core metrics layer
 * 
 * HARD OVERRIDE LINE:
 * "Render ONE radar axis per Skill. Do not group, bucket, or aggregate multiple skills 
 * into fewer axes under any circumstances."
 * 
 * LIVE SYNCHRONIZATION:
 * - Create skill → new axis appears
 * - Delete skill → axis disappears
 * - Update skill XP → vertex extends/contracts
 * - Rename skill → label updates
 */

// Maximum XP per skill for radar chart display normalization
const MAX_SKILL_XP = 2000;

interface SkillDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillName: string | null;
  skillXp: number;
  skillMaxXp: number;
  skillLevel: number;
}

const SkillDetailDialog = ({ 
  open, 
  onOpenChange, 
  skillName, 
  skillXp,
  skillMaxXp,
  skillLevel
}: SkillDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="system-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-foreground">
            {skillName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Current XP */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span className="text-muted-foreground">Current XP</span>
            <span className="text-lg font-medium text-foreground">{skillXp} XP</span>
          </div>
          
          {/* Max XP */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span className="text-muted-foreground">Max XP (Display)</span>
            <span className="text-lg font-medium text-foreground">{skillMaxXp} XP</span>
          </div>
          
          {/* Level */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span className="text-muted-foreground">Level</span>
            <span className="text-lg font-medium text-foreground">Level {skillLevel}</span>
          </div>
          
          {/* Progress Percentage */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-lg font-medium text-primary">
              {Math.round((skillXp / skillMaxXp) * 100)}%
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RadarChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(null);
  
  // SINGLE SOURCE OF TRUTH: Skills directly from database
  const { skills, isLoading } = useSkills();
  
  // Transform skills to radar data format
  // Each skill = one axis, no aggregation
  // CRITICAL: No useMemo - always derive directly from skills to ensure reactivity
  const data = skills.map(skill => ({
    label: skill.name,
    value: skill.xp,
    maxValue: MAX_SKILL_XP,
    level: skill.level,
    skillId: skill.id
  }));
  
  // Track statistics for debugging
  const totalSkills = skills.length;
  const activeSkills = skills.filter(s => s.is_active).length;
  const nonZeroSkills = skills.filter(s => s.xp > 0).length;

  // Handle canvas click to detect which axis was clicked
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const numAxes = data.length;

    // Calculate angle from center to click point
    const dx = x - centerX;
    const dy = y - centerY;
    const clickAngle = Math.atan2(dy, dx);
    
    // Use squared distance comparison to avoid expensive square root operation
    const distanceSquared = dx * dx + dy * dy;
    const maxDistanceSquared = (radius + 50) * (radius + 50);

    // Only respond to clicks near the chart area
    if (distanceSquared > maxDistanceSquared) return;

    // Find the closest axis
    let closestAxisIndex = 0;
    let minAngleDiff = Infinity;

    for (let i = 0; i < numAxes; i++) {
      const axisAngle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      let angleDiff = Math.abs(clickAngle - axisAngle);
      
      // Normalize angle difference to [0, PI]
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff < minAngleDiff) {
        minAngleDiff = angleDiff;
        closestAxisIndex = i;
      }
    }

    // Threshold: only select if click is within ~20 degrees of an axis
    const angleThreshold = Math.PI / 9; // ~20 degrees
    if (minAngleDiff < angleThreshold) {
      setSelectedSkillIndex(closestAxisIndex);
    }
  }, [data]);

  // Get selected skill details
  const selectedSkill = selectedSkillIndex !== null ? skills[selectedSkillIndex] : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Debug logging: Log radar re-renders
    if (process.env.NODE_ENV === 'development') {
      console.log('[Radar Chart] Re-rendering with skills:', {
        skillCount: data.length,
        timestamp: new Date().toISOString(),
        sampleSkills: data.slice(0, 3).map(d => ({ label: d.label, value: d.value })),
      });
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60; // More padding for labels
    const numAxes = data.length;
    
    // If no skills, show empty state
    if (numAxes === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#999";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No skills yet. Create skills to see your radar chart.", centerX, centerY);
      return;
    }
    
    // Use consistent max value for all skills
    const maxValue = MAX_SKILL_XP;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw polygon grid rings (NOT circular) - thin, evenly spaced, light gray
    const levels = 10; // For 0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000
    for (let i = levels; i >= 1; i--) {
      const levelRadius = (radius / levels) * i;
      ctx.beginPath();
      ctx.strokeStyle = "#E6E6E6"; // Light gray for grid rings (exact spec)
      ctx.lineWidth = 0.5; // Thin lines

      for (let j = 0; j <= numAxes; j++) {
        const angle = (Math.PI * 2 * j) / numAxes - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes lines - slightly darker than grid, still subtle and thin
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#D0D0D0"; // Slightly darker than grid, still subtle
      ctx.lineWidth = 0.5; // Thin line
      ctx.stroke();
    }

    // Draw center point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#9A9A9A";
    ctx.fill();

    // Draw labels outside the outer grid - thin, sans-serif, small, muted gray
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const labelRadius = radius + 30;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      ctx.font = "300 10px sans-serif"; // Thin, small, sans-serif
      ctx.fillStyle = "#8E8E8E"; // Muted gray (exact spec)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data[i].label, labelX, labelY);
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i <= numAxes; i++) {
      const index = i % numAxes;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const normalizedValue = data[index].value / maxValue;
      const x = centerX + Math.cos(angle) * radius * normalizedValue;
      const y = centerY + Math.sin(angle) * radius * normalizedValue;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill with neutral gray (#C8C8C8) at 40-45% opacity (spec)
    ctx.fillStyle = "rgba(200, 200, 200, 0.42)"; // #C8C8C8 at 42%
    ctx.fill();

    // Border with #9B9B9B at 1-1.5px (spec)
    ctx.strokeStyle = "#9B9B9B"; // Exact spec color
    ctx.lineWidth = 1.25; // 1.25px within 1-1.5px range
    ctx.stroke();

    // Draw numeric values at each vertex - small, light weight, low contrast
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const normalizedValue = data[i].value / maxValue;
      const x = centerX + Math.cos(angle) * radius * normalizedValue;
      const y = centerY + Math.sin(angle) * radius * normalizedValue;

      // Position value close to data point, offset slightly away from polygon
      const valueOffsetRadius = 10;
      const valueX = x + Math.cos(angle) * valueOffsetRadius;
      const valueY = y + Math.sin(angle) * valueOffsetRadius;

      ctx.font = "300 8px sans-serif"; // Very small, light weight
      ctx.fillStyle = "#9A9A9A"; // Low contrast (exact spec)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(data[i].value).toString(), valueX, valueY);
    }
  }, [data]);

  return (
    <div className="system-panel p-6 animate-fade-in-up animation-delay-100" style={{ background: '#FAFAFA' }}>
      {/* Debug Panel - Only in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-semibold text-blue-900 mb-2">🔍 Debug Info</div>
          <div className="space-y-1 text-blue-700">
            <div>Total Skills: {totalSkills}</div>
            <div>Radar Axes: {data.length}</div>
            <div>Active Skills: {activeSkills}</div>
            <div>Skills with XP: {nonZeroSkills}</div>
            <div className="text-blue-500 text-[10px] mt-2">
              ✅ Each skill = one radar axis (1:1 mapping)
            </div>
            <div className="text-blue-500 text-[10px]">
              Click skills to see details
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="w-full max-w-[500px] cursor-pointer"
              onClick={handleCanvasClick}
              title="Click on a skill axis to see details"
            />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {data.length === 0 
              ? "No skills yet. Create skills on the Skills page to see your radar chart." 
              : `Showing ${data.length} skill${data.length !== 1 ? 's' : ''} as radar axes. Click to see details.`
            }
          </p>
        </>
      )}
      
      {/* Skill Detail Dialog */}
      <SkillDetailDialog
        open={selectedSkillIndex !== null}
        onOpenChange={(open) => !open && setSelectedSkillIndex(null)}
        skillName={selectedSkill?.name || null}
        skillXp={selectedSkill?.xp || 0}
        skillMaxXp={MAX_SKILL_XP}
        skillLevel={selectedSkill?.level || 1}
      />
    </div>
  );
};

export default RadarChart;
