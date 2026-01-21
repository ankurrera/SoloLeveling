import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoutines } from "@/hooks/useRoutines";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { useWorkoutSets } from "@/hooks/useWorkoutSets";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Clock, Check, Plus, Minus, ArrowLeft } from "lucide-react";
import CornerDecoration from "@/components/system/CornerDecoration";
import { calculateSessionXP } from "@/lib/xpCalculation";
import type { Exercise } from "@/hooks/useExercises";
import type { RoutineWithExercises } from "@/hooks/useRoutines";

// Configuration constants
const AUTOSAVE_DEBOUNCE_MS = 2000;

interface ExerciseSetData {
  exercise_id: string;
  set_number: number;
  weight_kg: string;
  reps: string;
  rest_time_seconds?: number;
}

const ActiveWorkoutSession = () => {
  const { routineId } = useParams<{ routineId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile } = useProfile();

  const { getRoutineWithExercises, markRoutineAsUsedAsync } = useRoutines();
  const { createSession, updateSession, sessions } = useWorkoutSessions();
  const { createSetAsync, getSessionSets } = useWorkoutSets();

  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Timer state
  const [startTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Exercise sets data
  const [exerciseSets, setExerciseSets] = useState<Record<string, ExerciseSetData[]>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  const sessionCreationInitiated = useRef(false);
  const autosaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const savedSets = useRef<Set<string>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all pending autosave timeouts
      Object.values(autosaveTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Load routine and create session
  useEffect(() => {
    const loadRoutineAndCreateSession = async () => {
      if (!routineId || !user || sessionCreationInitiated.current) return;

      sessionCreationInitiated.current = true;
      setIsLoadingRoutine(true);

      try {
        // Load routine with exercises
        const routineData = await getRoutineWithExercises(routineId);
        setRoutine(routineData);

        // Mark routine as used
        await markRoutineAsUsedAsync(routineId);

        // Initialize empty sets for each exercise
        const initialSets: Record<string, ExerciseSetData[]> = {};
        routineData.exercises.forEach((exercise) => {
          initialSets[exercise.id] = [];
        });
        setExerciseSets(initialSets);

        // Create workout session
        setIsCreatingSession(true);
        createSession(
          {
            session_date: new Date().toISOString(),
            duration_minutes: null,
            notes: null,
            routine_id: routineId,
            status: 'active' as const, // Start as active
            // start_time will be set by database default to server time (now())
          },
          {
            onSuccess: (session) => {
              setSessionId(session.id);
              setIsCreatingSession(false);
              toast.success("Workout session started!");
            },
            onError: (error) => {
              console.error("Failed to create session:", error);
              toast.error("Failed to start workout session");
              setIsCreatingSession(false);
              sessionCreationInitiated.current = false;
            },
          }
        );
      } catch (error) {
        console.error("Failed to load routine:", error);
        toast.error("Failed to load routine");
        navigate("/routines");
      } finally {
        setIsLoadingRoutine(false);
      }
    };

    loadRoutineAndCreateSession();
  }, [routineId, user, getRoutineWithExercises, markRoutineAsUsedAsync, createSession, navigate, startTime]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-save set to database
  const autosaveSet = useCallback(
    async (exerciseId: string, setIndex: number) => {
      if (!sessionId) return;

      const sets = exerciseSets[exerciseId];
      if (!sets || !sets[setIndex]) return;

      const setData = sets[setIndex];
      const weight = parseFloat(setData.weight_kg);
      const reps = parseInt(setData.reps);

      if (isNaN(weight) || isNaN(reps) || reps <= 0) return;

      // Check if this set was already saved to prevent duplicates
      const setKey = `${exerciseId}-${setData.set_number}-${weight}-${reps}`;
      if (savedSets.current.has(setKey)) return;

      setIsSaving((prev) => ({ ...prev, [`${exerciseId}-${setIndex}`]: true }));

      try {
        await createSetAsync({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setData.set_number,
          weight_kg: weight,
          reps: reps,
          rest_time_seconds: setData.rest_time_seconds,
        });

        // Mark as saved
        savedSets.current.add(setKey);

        // Store in local storage as backup
        const backupKey = `workout_backup_${sessionId}`;
        localStorage.setItem(backupKey, JSON.stringify(exerciseSets));
      } catch (error) {
        console.error("Failed to save set:", error);
        toast.error("Failed to auto-save set");
      } finally {
        setIsSaving((prev) => ({ ...prev, [`${exerciseId}-${setIndex}`]: false }));
      }
    },
    [sessionId, exerciseSets, createSetAsync]
  );

  // Debounced autosave
  const scheduleAutosave = useCallback(
    (exerciseId: string, setIndex: number) => {
      const key = `${exerciseId}-${setIndex}`;
      
      // Clear existing timeout
      if (autosaveTimeouts.current[key]) {
        clearTimeout(autosaveTimeouts.current[key]);
      }

      // Schedule new autosave
      autosaveTimeouts.current[key] = setTimeout(() => {
        autosaveSet(exerciseId, setIndex);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [autosaveSet]
  );

  const handleAddSet = (exerciseId: string) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] || [];
      const newSetNumber = currentSets.length + 1;
      
      // Pre-fill with last set's weight if available
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: ExerciseSetData = {
        exercise_id: exerciseId,
        set_number: newSetNumber,
        weight_kg: lastSet?.weight_kg || "",
        reps: lastSet?.reps || "",
      };

      return {
        ...prev,
        [exerciseId]: [...currentSets, newSet],
      };
    });
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] || [];
      const newSets = currentSets.filter((_, i) => i !== setIndex);
      
      // Renumber sets
      const renumbered = newSets.map((set, i) => ({
        ...set,
        set_number: i + 1,
      }));

      return {
        ...prev,
        [exerciseId]: renumbered,
      };
    });
  };

  const handleSetChange = (exerciseId: string, setIndex: number, field: "weight_kg" | "reps", value: string) => {
    setExerciseSets((prev) => {
      const currentSets = [...(prev[exerciseId] || [])];
      currentSets[setIndex] = {
        ...currentSets[setIndex],
        [field]: value,
      };

      return {
        ...prev,
        [exerciseId]: currentSets,
      };
    });

    // Schedule autosave
    scheduleAutosave(exerciseId, setIndex);
  };

  const handleCompleteWorkout = async () => {
    if (!sessionId) return;

    const durationMinutes = Math.floor(elapsedSeconds / 60);

    // Convert exerciseSets to the format expected by XP calculation
    const allSets = Object.values(exerciseSets)
      .flat()
      .filter((set) => {
        const weight = parseFloat(set.weight_kg);
        const reps = parseInt(set.reps);
        return !isNaN(weight) && !isNaN(reps) && reps > 0;
      })
      .map((set) => ({
        weight_kg: parseFloat(set.weight_kg),
        reps: parseInt(set.reps),
      }));

    // Validation: must have at least one set
    if (allSets.length === 0) {
      toast.error("You must log at least one set");
      return;
    }

    setIsCompleting(true);

    try {
      // Calculate consistency (sessions in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSessions = sessions.filter(
        (s) => new Date(s.session_date) > sevenDaysAgo
      );

      // Calculate XP using the sophisticated formula
      const earnedXP = calculateSessionXP(
        {
          sets: allSets,
          duration_minutes: durationMinutes,
        },
        {
          fatigue_level: profile?.fatigue_level || 0,
        },
        {
          sessions_this_week: recentSessions.length,
        },
        {
          bodyweight_kg: profile?.bodyweight_kg,
        }
      );

      // Update session with completion data
      // Set status to 'completed' - database trigger will set end_time to server now()
      // and calculate duration_minutes automatically
      updateSession(
        {
          id: sessionId,
          status: 'completed' as const, // Trigger will set end_time=now() and calculate duration
          is_completed: true, // Legacy field for backward compatibility
          completion_time: new Date().toISOString(),
          total_xp_earned: earnedXP,
        },
        {
          onSuccess: () => {
            toast.success(`Workout completed! +${earnedXP} XP earned!`);
            
            // Clear local storage backup
            localStorage.removeItem(`workout_backup_${sessionId}`);
            
            navigate("/");
          },
          onError: (error) => {
            console.error("Failed to complete workout:", error);
            toast.error("Failed to complete workout");
            setIsCompleting(false);
          },
        }
      );
    } catch (error) {
      console.error("Failed to complete workout:", error);
      toast.error("Failed to complete workout");
      setIsCompleting(false);
    }
  };

  if (authLoading || isLoadingRoutine || isCreatingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isCreatingSession ? "Starting workout session..." : "Loading routine..."}
          </p>
        </div>
      </div>
    );
  }

  if (!routine || !sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <CornerDecoration className="inset-0 z-10" />

      {/* Main Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 mb-4">
          <Link to="/routines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Clock className="w-6 h-6" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Routine Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{routine.name}</CardTitle>
            {routine.description && (
              <CardDescription>{routine.description}</CardDescription>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {routine.muscle_groups.map((mg) => (
                <Badge key={mg} variant="secondary">
                  {mg}
                </Badge>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Exercises */}
        <div className="space-y-4">
          {routine.exercises.map((exercise) => (
            <Card key={exercise.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">{exercise.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.map((mg) => (
                    <Badge key={mg} variant="outline" className="text-xs">
                      {mg}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Sets */}
                {exerciseSets[exercise.id]?.map((set, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-semibold w-12">Set {set.set_number}</span>
                    <Input
                      type="number"
                      placeholder="Weight (kg)"
                      value={set.weight_kg}
                      onChange={(e) => handleSetChange(exercise.id, index, "weight_kg", e.target.value)}
                      className="flex-1"
                      step="0.5"
                    />
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => handleSetChange(exercise.id, index, "reps", e.target.value)}
                      className="flex-1"
                      min="1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSet(exercise.id, index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    {isSaving[`${exercise.id}-${index}`] && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                ))}

                {/* Add Set Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAddSet(exercise.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Set
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Complete Workout Button */}
        <div className="mt-8 sticky bottom-4">
          <Button
            className="w-full h-14 text-lg uppercase tracking-wider hover-glow"
            size="lg"
            onClick={handleCompleteWorkout}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Complete Workout
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Duration: {Math.floor(elapsedSeconds / 60)} minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkoutSession;
