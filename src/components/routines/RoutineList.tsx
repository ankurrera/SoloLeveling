import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoutines } from "@/hooks/useRoutines";
import { Play, Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RoutineList = () => {
  const navigate = useNavigate();
  const { routines, isLoading, deleteRoutineAsync, toggleFavoriteAsync } = useRoutines();
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartWorkout = (routineId: string) => {
    navigate(`/workout/${routineId}`);
  };

  const handleToggleFavorite = async (routineId: string, currentFavorite: boolean) => {
    try {
      await toggleFavoriteAsync({ id: routineId, isFavorite: !currentFavorite });
      toast.success(currentFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRoutineId) return;

    setIsDeleting(true);
    try {
      await deleteRoutineAsync(deleteRoutineId);
      toast.success("Routine deleted successfully");
      setDeleteRoutineId(null);
    } catch (error) {
      console.error("Failed to delete routine:", error);
      toast.error("Failed to delete routine");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!routines || routines.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center mb-4">
            No routines yet. Create your first training routine to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map((routine) => (
          <Card
            key={routine.id}
            className="border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {routine.name}
                    {routine.is_favorite && (
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </CardTitle>
                  {routine.description && (
                    <CardDescription className="mt-2">
                      {routine.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Muscle Groups */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Muscle Groups</p>
                <div className="flex flex-wrap gap-2">
                  {routine.muscle_groups.map((mg) => (
                    <Badge key={mg} variant="secondary">
                      {mg}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Exercise Count */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {routine.exercise_ids.length} exercise{routine.exercise_ids.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Last Used */}
              {routine.last_used_at && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(routine.last_used_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 hover-glow"
                  onClick={() => handleStartWorkout(routine.id)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Workout
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleToggleFavorite(routine.id, routine.is_favorite || false)}
                >
                  <Star
                    className={`w-4 h-4 ${
                      routine.is_favorite ? "fill-yellow-500 text-yellow-500" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteRoutineId(routine.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoutineId} onOpenChange={() => setDeleteRoutineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this routine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoutineList;
