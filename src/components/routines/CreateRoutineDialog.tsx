import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useExercises } from "@/hooks/useExercises";
import { useRoutines } from "@/hooks/useRoutines";
import { Loader2, Check, Info } from "lucide-react";

interface CreateRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get difficulty display info
const getDifficultyInfo = (difficulty: string | null) => {
  switch (difficulty) {
    case "B":
      return {
        label: "Beginner",
        variant: "beginner" as const,
        description: "Low technical complexity",
      };
    case "I":
      return {
        label: "Intermediate",
        variant: "intermediate" as const,
        description: "Moderate load & control",
      };
    case "A":
      return {
        label: "Advanced",
        variant: "advanced" as const,
        description: "High load, stability, injury risk",
      };
    default:
      return {
        label: "Unknown",
        variant: "outline" as const,
        description: "Difficulty not specified",
      };
  }
};

const CreateRoutineDialog = ({ open, onOpenChange }: CreateRoutineDialogProps) => {
  const [step, setStep] = useState<"muscle-groups" | "exercises" | "details">("muscle-groups");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { muscleGroups, exercises, isLoading, getExercisesByMuscleGroups } = useExercises();
  const { createRoutineAsync } = useRoutines();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("muscle-groups");
      setSelectedMuscleGroups([]);
      setSelectedExercises([]);
      setDifficultyFilter("all");
      setRoutineName("");
      setDescription("");
    }
  }, [open]);

  const handleMuscleGroupToggle = (muscleGroupName: string) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(muscleGroupName)
        ? prev.filter((mg) => mg !== muscleGroupName)
        : [...prev, muscleGroupName]
    );
  };

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleNext = () => {
    if (step === "muscle-groups") {
      if (selectedMuscleGroups.length === 0) {
        toast.error("Please select at least one muscle group");
        return;
      }
      setStep("exercises");
    } else if (step === "exercises") {
      if (selectedExercises.length === 0) {
        toast.error("Please select at least one exercise");
        return;
      }
      setStep("details");
    }
  };

  const handleBack = () => {
    if (step === "exercises") {
      setStep("muscle-groups");
    } else if (step === "details") {
      setStep("exercises");
    }
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      toast.error("Please enter a routine name");
      return;
    }

    setIsSaving(true);
    try {
      await createRoutineAsync({
        name: routineName,
        description: description || undefined,
        muscle_groups: selectedMuscleGroups,
        exercise_ids: selectedExercises,
      });
      toast.success("Routine created successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create routine:", error);
      toast.error("Failed to create routine");
    } finally {
      setIsSaving(false);
    }
  };

  // Get exercises filtered by muscle groups and difficulty, then sorted by difficulty
  const filteredExercises = (() => {
    let exercises = getExercisesByMuscleGroups(selectedMuscleGroups);
    
    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      exercises = exercises.filter((ex) => ex.difficulty === difficultyFilter);
    }
    
    // Sort by difficulty: Beginner → Intermediate → Advanced
    const difficultyOrder: Record<string, number> = { B: 1, I: 2, A: 3 };
    exercises.sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty || ''] ?? 999;
      const orderB = difficultyOrder[b.difficulty || ''] ?? 999;
      return orderA - orderB;
    });
    
    return exercises;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary uppercase tracking-wider">
            Create Training Routine
          </DialogTitle>
          <DialogDescription>
            {step === "muscle-groups" && "Step 1: Select muscle groups to target"}
            {step === "exercises" && "Step 2: Choose exercises for your routine"}
            {step === "details" && "Step 3: Name your routine"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Muscle Groups */}
          {step === "muscle-groups" && (
            <div className="space-y-4">
              <Label>Select Muscle Groups</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {muscleGroups?.map((mg) => (
                    <div
                      key={mg.id}
                      onClick={() => handleMuscleGroupToggle(mg.name)}
                      className={`
                        relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer
                        transition-all duration-200 hover:border-primary/50
                        ${
                          selectedMuscleGroups.includes(mg.name)
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }
                      `}
                    >
                      <Checkbox
                        checked={selectedMuscleGroups.includes(mg.name)}
                        onCheckedChange={() => handleMuscleGroupToggle(mg.name)}
                      />
                      <Label className="cursor-pointer flex-1">{mg.name}</Label>
                      {selectedMuscleGroups.includes(mg.name) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={selectedMuscleGroups.length === 0}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Exercises */}
          {step === "exercises" && (
            <div className="space-y-4">
              <div>
                <Label>Selected Muscle Groups</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMuscleGroups.map((mg) => (
                    <Badge key={mg} variant="secondary">
                      {mg}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Filter by Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="B">Beginner Only</SelectItem>
                    <SelectItem value="I">Intermediate Only</SelectItem>
                    <SelectItem value="A">Advanced Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Exercises ({selectedExercises.length} selected)</Label>
                <ScrollArea className="h-[300px] mt-2 border rounded-lg p-4">
                  <TooltipProvider>
                    <div className="space-y-2">
                      {filteredExercises.map((exercise) => {
                        const diffInfo = getDifficultyInfo(exercise.difficulty);
                        return (
                          <div
                            key={exercise.id}
                            onClick={() => handleExerciseToggle(exercise.id)}
                            className={`
                              flex items-start space-x-3 p-3 border rounded-lg cursor-pointer
                              transition-all duration-200 hover:border-primary/50
                              ${
                                selectedExercises.includes(exercise.id)
                                  ? "border-primary bg-primary/10"
                                  : "border-border"
                              }
                            `}
                          >
                            <Checkbox
                              checked={selectedExercises.includes(exercise.id)}
                              onCheckedChange={() => handleExerciseToggle(exercise.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label className="cursor-pointer font-semibold">
                                  {exercise.name}
                                </Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={diffInfo.variant} className="cursor-help">
                                      {diffInfo.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{diffInfo.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exercise.muscle_groups.map((mg) => (
                                  <Badge key={mg} variant="outline" className="text-xs">
                                    {mg}
                                  </Badge>
                                ))}
                              </div>
                              {exercise.equipment && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {exercise.equipment}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </ScrollArea>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={selectedExercises.length === 0}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <Label>Routine Summary</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedMuscleGroups.join(", ")}
                  </p>
                  <p className="text-sm font-medium">
                    {selectedExercises.length} exercises selected
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="routine-name">Routine Name *</Label>
                <Input
                  id="routine-name"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="e.g., Chest & Triceps Day"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this routine..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !routineName.trim()}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Routine
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoutineDialog;
