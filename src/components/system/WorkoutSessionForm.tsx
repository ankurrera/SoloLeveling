import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import InlineWorkoutLogger from "./InlineWorkoutLogger";

const WorkoutSessionForm = () => {
  const [isLogging, setIsLogging] = useState(false);

  if (isLogging) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLogging(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
        <InlineWorkoutLogger
          sessionId={null}
          onComplete={() => setIsLogging(false)}
        />
      </div>
    );
  }

  return (
    <Button
      className="w-full sm:w-auto uppercase tracking-[0.1em]"
      onClick={() => setIsLogging(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Log Workout
    </Button>
  );
};

export default WorkoutSessionForm;
