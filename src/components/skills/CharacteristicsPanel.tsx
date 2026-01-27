import { useState } from "react";
import { Characteristic, useCharacteristics } from "@/hooks/useCharacteristics";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CharacteristicCard from "./CharacteristicCard";
import CreateCharacteristicForm from "./CreateCharacteristicForm";

interface CharacteristicsPanelProps {
  characteristics: Characteristic[];
}

const CharacteristicsPanel = ({ characteristics }: CharacteristicsPanelProps) => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal text-muted-foreground">
          Characteristics
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <CreateCharacteristicForm onClose={() => setIsCreating(false)} />
      )}

      {/* Characteristics List */}
      <div className="space-y-3">
        {characteristics.length === 0 && !isCreating && (
          <div className="system-panel p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No characteristics yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="border-border hover:bg-muted"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Characteristic
            </Button>
          </div>
        )}
        
        {characteristics.map((characteristic) => (
          <CharacteristicCard
            key={characteristic.id}
            characteristic={characteristic}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacteristicsPanel;
