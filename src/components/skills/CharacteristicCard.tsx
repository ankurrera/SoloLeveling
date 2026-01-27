import { useState } from "react";
import { Characteristic, useCharacteristics } from "@/hooks/useCharacteristics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateLevelProgress } from "@/lib/levelCalculation";
import { Edit2, Trash2, Save, X, Star, Calendar as CalendarIcon } from "lucide-react";
import { getConsistencyStatusMessage } from "@/lib/consistencyCalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CharacteristicCalendar from "./CharacteristicCalendar";
import ConfirmDialog from "./ConfirmDialog";

interface CharacteristicCardProps {
  characteristic: Characteristic;
}

const CharacteristicCard = ({ characteristic }: CharacteristicCardProps) => {
  const { updateCharacteristic, deleteCharacteristic } = useCharacteristics();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editName, setEditName] = useState(characteristic.name);
  const [editIcon, setEditIcon] = useState(characteristic.icon);
  const [editXP, setEditXP] = useState(characteristic.xp.toString());

  const progress = calculateLevelProgress(characteristic.xp);

  const handleSave = () => {
    updateCharacteristic.mutate({
      id: characteristic.id,
      name: editName,
      icon: editIcon,
      xp: parseInt(editXP) || 0,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(characteristic.name);
    setEditIcon(characteristic.icon);
    setEditXP(characteristic.xp.toString());
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteCharacteristic.mutate(characteristic.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="system-panel p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {isEditing ? (
            <>
              <Input
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="w-12 text-xl text-center bg-input border-border"
                maxLength={2}
              />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-input border-border"
                placeholder="Name"
              />
            </>
          ) : (
            <>
              <div className="text-2xl">{characteristic.icon}</div>
              <div className="flex-1">
                <h3 className="font-normal text-foreground">
                  {characteristic.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Level {characteristic.level}
                  </span>
                  <Star className="w-3 h-3 text-primary/70 fill-primary/70" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Streak and Consistency */}
      {!isEditing && (
        <div className="flex items-center justify-between text-xs border-t border-border/30 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Streak:</span>
            <span className="font-medium text-foreground">{characteristic.current_streak}</span>
          </div>
          <span className="text-muted-foreground">
            {getConsistencyStatusMessage(characteristic.consistency_state, characteristic.current_streak)}
          </span>
        </div>
      )}

      {/* XP Input (when editing) */}
      {isEditing && (
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
            XP
          </label>
          <Input
            type="number"
            value={editXP}
            onChange={(e) => setEditXP(e.target.value)}
            className="bg-input border-border"
            placeholder="0"
          />
        </div>
      )}

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.xpInCurrentLevel} / {progress.xpNeededForNextLevel} XP</span>
          <span>{Math.round(progress.progressPercentage)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/70 transition-all duration-300"
            style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Calendar Section */}
      {!isEditing && (
        <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-border/30 hover:bg-muted"
              size="sm"
            >
              <CalendarIcon className="w-3 h-3 mr-2" />
              {isCalendarOpen ? "Hide Calendar" : "Track Progress"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <CharacteristicCalendar characteristic={characteristic} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Characteristic"
        description={`Are you sure you want to delete "${characteristic.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default CharacteristicCard;
