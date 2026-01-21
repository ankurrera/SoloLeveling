import { Button } from "@/components/ui/button";
import { Sword } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WorkoutSessionForm = () => {
  const navigate = useNavigate();

  return (
    <Button
      className="w-full sm:w-auto uppercase tracking-[0.1em]"
      onClick={() => navigate("/routines")}
    >
      <Sword className="w-4 h-4 mr-2" />
      Quest Preparations
    </Button>
  );
};

export default WorkoutSessionForm;
