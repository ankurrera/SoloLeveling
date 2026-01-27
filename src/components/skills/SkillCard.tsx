import { useState } from "react";
import { Skill, useSkills } from "@/hooks/useSkills";
import { Button } from "@/components/ui/button";
import { calculateLevelProgress } from "@/lib/levelCalculation";
import { Edit2, Trash2, Star, Power, PowerOff, Calendar as CalendarIcon, Target } from "lucide-react";
import { getConsistencyStatusMessage } from "@/lib/consistencyCalculations";
import { getSkillMetricContributions } from "@/lib/coreMetricCalculation";
import EditSkillDialog from "./EditSkillDialog";
import ConfirmDialog from "./ConfirmDialog";
import SkillCalendar from "./SkillCalendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface SkillCardProps {
  skill: Skill;
}

/** Maximum number of metric contributions to display inline on a skill card */
const MAX_DISPLAYED_CONTRIBUTIONS = 3;

const SkillCard = ({ skill }: SkillCardProps) => {
  const { updateSkill, deleteSkill } = useSkills();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const progress = calculateLevelProgress(skill.xp);

  // Calculate which metrics this skill affects (bi-directional debugging)
  const skillContributionData = {
    id: skill.id,
    name: skill.name,
    xp: skill.xp,
    area: skill.area,
    contributesTo: skill.contributes_to || undefined,
  };
  const metricContributions = getSkillMetricContributions(skillContributionData);

  const handleToggleActive = () => {
    updateSkill.mutate({
      id: skill.id,
      is_active: !skill.is_active,
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteSkill.mutate(skill.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={`system-panel p-0 overflow-hidden transition-all ${
          skill.is_active ? "opacity-100" : "opacity-60"
        }`}
      >
        {/* Cover Image */}
        {skill.cover_image && (
          <div
            className="h-32 bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${skill.cover_image})` }}
          />
        )}
        {!skill.cover_image && (
          <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <div className="text-4xl text-muted-foreground/30">
              {skill.area ? skill.area.charAt(0).toUpperCase() : "S"}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-normal text-foreground mb-1">
                {skill.name}
              </h3>
              {skill.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {skill.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditDialogOpen(true)}
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
            </div>
          </div>

          {/* Level and Area */}
          <div className="flex items-center justify-between text-xs">
            {skill.area && (
              <span className="text-muted-foreground bg-muted px-2 py-1 rounded">
                {skill.area}
              </span>
            )}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Level {skill.level}</span>
              <Star className="w-3 h-3 text-primary/70 fill-primary/70" />
            </div>
          </div>

          {/* Metric Contributions - shows which Core Metrics this skill affects */}
          {metricContributions.length > 0 && (
            <TooltipProvider>
              <div className="flex items-center gap-1 text-xs flex-wrap">
                <Target className="w-3 h-3 text-muted-foreground" />
                {metricContributions.slice(0, MAX_DISPLAYED_CONTRIBUTIONS).map((contribution) => (
                  <Tooltip key={contribution.metricName}>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded cursor-help">
                        {contribution.metricName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        +{contribution.contributedXp} XP ({Math.round(contribution.weight * 100)}% weight)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {metricContributions.length > MAX_DISPLAYED_CONTRIBUTIONS && (
                  <span className="text-muted-foreground">
                    +{metricContributions.length - MAX_DISPLAYED_CONTRIBUTIONS} more
                  </span>
                )}
              </div>
            </TooltipProvider>
          )}

          {/* Streak and Consistency */}
          <div className="flex items-center justify-between text-xs border-t border-border/30 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-medium text-foreground">{skill.current_streak} days</span>
            </div>
            <span className="text-muted-foreground">
              {getConsistencyStatusMessage(skill.consistency_state, skill.current_streak)}
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.xpInCurrentLevel} / {progress.xpNeededForNextLevel}</span>
              <span>{Math.round(progress.progressPercentage)}%</span>
            </div>
            
            {/* Segmented Progress Bar */}
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const segmentProgress = (progress.progressPercentage - i * 10) / 10;
                const fillLevel = Math.max(0, Math.min(1, segmentProgress));
                return (
                  <div
                    key={i}
                    className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden"
                  >
                    <div
                      className="h-full bg-foreground/70 transition-all duration-300"
                      style={{ width: `${fillLevel * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Section */}
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
              <SkillCalendar skill={skill} />
            </CollapsibleContent>
          </Collapsible>

          {/* Active/Inactive Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              {skill.is_active ? "Active" : "Inactive"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleActive}
              className={`h-7 px-3 text-xs ${
                skill.is_active
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {skill.is_active ? (
                <Power className="w-3 h-3 mr-1" />
              ) : (
                <PowerOff className="w-3 h-3 mr-1" />
              )}
              {skill.is_active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditSkillDialog
        skill={skill}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Skill"
        description={`Are you sure you want to delete "${skill.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default SkillCard;
