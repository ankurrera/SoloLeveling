import { useState } from "react";
import { useCharacteristics } from "@/hooks/useCharacteristics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { CHARACTERISTIC_ICONS } from "@/lib/skillsConstants";

interface CreateCharacteristicFormProps {
  onClose: () => void;
}

const CreateCharacteristicForm = ({ onClose }: CreateCharacteristicFormProps) => {
  const { createCharacteristic } = useCharacteristics();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CHARACTERISTIC_ICONS[0]);
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [goalMinutes, setGoalMinutes] = useState("30");
  const [baseXp, setBaseXp] = useState("50");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goalMinutes || !baseXp) return;

    createCharacteristic.mutate(
      {
        name: name.trim(),
        icon,
        xp: 0, // Start with 0 XP, will be calculated from attendance
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
    <div className="system-panel p-4 space-y-4 border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-normal text-foreground">
          New Characteristic
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon Selection */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CHARACTERISTIC_ICONS.map((iconOption) => (
              <button
                key={iconOption}
                type="button"
                onClick={() => setIcon(iconOption)}
                className={`
                  p-2 text-xl rounded border transition-all
                  ${
                    icon === iconOption
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted hover:border-primary/50"
                  }
                `}
              >
                {iconOption}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Strength, Intelligence, Agility"
            className="bg-input border-border"
            required
          />
        </div>

        {/* Time Goal Section */}
        <div className="border-t border-border/30 pt-3 space-y-3">
          <h4 className="text-xs font-medium text-foreground">Development Time Goal *</h4>
          
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

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
            disabled={!name.trim() || !goalMinutes || !baseXp || createCharacteristic.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createCharacteristic.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCharacteristicForm;
