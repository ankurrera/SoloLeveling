import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateSkillForm from "./CreateSkillForm";
import CreateCharacteristicForm from "./CreateCharacteristicForm";

const QuickCreatePanel = () => {
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showCharacteristicForm, setShowCharacteristicForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      {!showSkillForm && !showCharacteristicForm && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSkillForm(true)}
            className="border-border hover:bg-muted"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Area – Skill
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCharacteristicForm(true)}
            className="border-border hover:bg-muted"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Characteristic
          </Button>
        </div>
      )}

      {/* Forms */}
      {showSkillForm && (
        <CreateSkillForm onClose={() => setShowSkillForm(false)} />
      )}
      {showCharacteristicForm && (
        <CreateCharacteristicForm onClose={() => setShowCharacteristicForm(false)} />
      )}
    </div>
  );
};

export default QuickCreatePanel;
