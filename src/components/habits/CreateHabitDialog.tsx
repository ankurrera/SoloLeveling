import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits, HabitColor } from "@/hooks/useHabits";
import { Plus } from "lucide-react";

interface CreateHabitDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const CreateHabitDialog = ({ trigger, onSuccess }: CreateHabitDialogProps) => {
  const { createHabit } = useHabits();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "🎯",
    color: "purple" as HabitColor,
    win_xp: 50,
    lose_xp: 25,
    duration_days: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createHabit.mutateAsync(formData);
      setOpen(false);
      // Reset form
      setFormData({
        name: "",
        icon: "🎯",
        color: "purple",
        win_xp: 50,
        lose_xp: 25,
        duration_days: 30,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const iconOptions = ["🎯", "📖", "🌱", "💪", "🏃", "🧘", "💻", "🎨", "🎵", "☕"];
  const colorOptions: { value: HabitColor; label: string }[] = [
    { value: "purple", label: "Purple" },
    { value: "green", label: "Green" },
    { value: "gold", label: "Gold" },
    { value: "orange", label: "Orange" },
    { value: "brown", label: "Brown" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="hover-glow bg-muted border border-border text-foreground hover:bg-accent">
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="system-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="font-gothic text-xl text-foreground uppercase tracking-wider">
            Create New Habit
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-foreground uppercase tracking-wider">
              Habit Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Read 1 Page"
              required
              className="bg-input border-border"
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground uppercase tracking-wider">
              Icon
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`
                    p-3 text-2xl rounded border transition-all
                    ${formData.icon === icon 
                      ? 'border-primary bg-primary/20' 
                      : 'border-border bg-muted hover:border-primary/50'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm text-foreground uppercase tracking-wider">
              Color
            </Label>
            <Select
              value={formData.color}
              onValueChange={(value) => setFormData({ ...formData, color: value as HabitColor })}
            >
              <SelectTrigger id="color" className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* XP Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="win_xp" className="text-sm text-foreground uppercase tracking-wider">
                Win XP
              </Label>
              <Input
                id="win_xp"
                type="number"
                min="1"
                value={formData.win_xp}
                onChange={(e) => setFormData({ ...formData, win_xp: parseInt(e.target.value) })}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lose_xp" className="text-sm text-foreground uppercase tracking-wider">
                Lose XP
              </Label>
              <Input
                id="lose_xp"
                type="number"
                min="1"
                value={formData.lose_xp}
                onChange={(e) => setFormData({ ...formData, lose_xp: parseInt(e.target.value) })}
                required
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm text-foreground uppercase tracking-wider">
              Duration (Days)
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
              required
              className="bg-input border-border"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createHabit.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createHabit.isPending ? "Creating..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateHabitDialog;
