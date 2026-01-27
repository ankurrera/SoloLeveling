import { useState } from "react";
import { useSkills } from "@/hooks/useSkills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface CreateSkillFormProps {
  onClose: () => void;
}

const CreateSkillForm = ({ onClose }: CreateSkillFormProps) => {
  const { createSkill } = useSkills();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [goalMinutes, setGoalMinutes] = useState("30");
  const [baseXp, setBaseXp] = useState("50");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goalMinutes || !baseXp) return;

    createSkill.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        area: area.trim() || undefined,
        cover_image: coverImage.trim() || undefined,
        xp: 0, // Start with 0 XP, will be calculated from attendance
        is_active: true,
        goal_type: goalType,
        goal_minutes: parseInt(goalMinutes),
        base_xp: parseInt(baseXp),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="system-panel p-6 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-normal text-foreground">
          New Skill
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Skill Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Web Development, Guitar Playing"
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
              placeholder="e.g., Programming, Music, Fitness"
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
            placeholder="Brief description of this skill..."
            className="bg-input border-border resize-none"
            rows={3}
          />
        </div>

        {/* Time Goal Section */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Development Time Goal *</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Goal Type */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Goal Type *
              </label>
              <Select value={goalType} onValueChange={(value: 'daily' | 'weekly') => setGoalType(value)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goal Minutes */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Time Goal (minutes) *
              </label>
              <Input
                type="number"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(e.target.value)}
                placeholder="30"
                className="bg-input border-border"
                min="1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {goalType === 'daily' ? 'Minutes per day' : 'Minutes per week'}
              </p>
            </div>

            {/* Base XP */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Base XP *
              </label>
              <Input
                type="number"
                value={baseXp}
                onChange={(e) => setBaseXp(e.target.value)}
                placeholder="50"
                className="bg-input border-border"
                min="1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                XP per successful day
              </p>
            </div>
          </div>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Cover Image URL (Optional)
          </label>
          <Input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="bg-input border-border"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || !goalMinutes || !baseXp || createSkill.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createSkill.isPending ? "Creating..." : "Create Skill"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSkillForm;
