import { Button } from "@/components/ui/button";
import { Sword, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WorkoutSessionForm = () => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 flex-wrap justify-center">
      <Button
        className="w-full sm:w-auto uppercase tracking-[0.1em]"
        onClick={() => navigate("/routines")}
      >
        <Sword className="w-4 h-4 mr-2" />
        Quest Preparations
      </Button>
      <Button
        variant="outline"
        className="w-full sm:w-auto uppercase tracking-[0.1em] border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        onClick={() => navigate("/habits")}
      >
        <Target className="w-4 h-4 mr-2" />
        + Create Habit
      </Button>
    </div>
  );
};

export default WorkoutSessionForm;
