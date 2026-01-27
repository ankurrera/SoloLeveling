import { useState, useEffect } from "react";
import { Skill, useSkills } from "@/hooks/useSkills";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSkillMetricContributions } from "@/lib/coreMetricCalculation";
import { getDefaultMapping } from "@/lib/coreMetrics";

interface EditSkillDialogProps {
  skill: Skill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSkillDialog = ({ skill, open, onOpenChange }: EditSkillDialogProps) => {
  const { updateSkill } = useSkills();
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description || "");
  const [area, setArea] = useState(skill.area || "");
  const [coverImage, setCoverImage] = useState(skill.cover_image || "");

  // Reset form when skill changes
  useEffect(() => {
    setName(skill.name);
    setDescription(skill.description || "");
    setArea(skill.area || "");
    setCoverImage(skill.cover_image || "");
  }, [skill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateSkill.mutate(
      {
        id: skill.id,
        name: name.trim(),
        description: description.trim() || null,
        area: area.trim() || null,
        cover_image: coverImage.trim() || null,
        // XP is computed from attendance records - not manually editable
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  // Calculate which metrics this skill affects
  const skillContributionData = {
    id: skill.id,
    name: skill.name,
    xp: skill.xp,
    area: skill.area,
    contributesTo: skill.contributes_to || undefined,
  };
  const metricContributions = getSkillMetricContributions(skillContributionData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="system-panel max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-foreground">
            Edit Skill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Skill Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Skill name"
                className="bg-input border-border"
                required
              />
            </div>

            {/* Area */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Area / Category
              </label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area or category"
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Cover Image URL
            </label>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="bg-input border-border"
            />
          </div>

          {/* XP Display (Read-only) - Shows computed value */}
          <div className="border-t border-border/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Current XP (computed from attendance)
              </span>
              <span className="text-lg font-medium text-foreground">
                {skill.xp} XP
              </span>
            </div>
          </div>

          {/* Metric Contributions Display - Bi-directional debugging */}
          {metricContributions.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                Core Metrics Affected
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {metricContributions.map((contribution) => (
                  <div 
                    key={contribution.metricName}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                  >
                    <span className="text-foreground">{contribution.metricName}</span>
                    <span className="text-muted-foreground">
                      +{contribution.contributedXp} XP ({Math.round(contribution.weight * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateSkill.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {updateSkill.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSkillDialog;
