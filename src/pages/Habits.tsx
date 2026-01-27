import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHabits } from "@/hooks/useHabits";
import HabitCard from "@/components/habits/HabitCard";
import QuestCard from "@/components/habits/QuestCard";
import CreateHabitDialog from "@/components/habits/CreateHabitDialog";
import CornerDecoration from "@/components/system/CornerDecoration";
import { Button } from "@/components/ui/button";
import { Home, Settings, Calendar, Target, Trophy, Swords, Sparkles } from "lucide-react";

const Habits = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { habits, toggleHabitCompletion } = useHabits();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleToggleCompletion = (habitId: string, date: string) => {
    toggleHabitCompletion.mutate({ habitId, date });
  };

  // Sample habits for display if none exist
  const displayHabits = habits.length > 0 ? habits.slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />
      
      {/* Corner Decorations */}
      <CornerDecoration className="inset-0 z-10" />

      {/* Main Content Container */}
      <div className="relative z-20 flex min-h-screen">
        {/* Left Side - Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-gothic text-3xl text-primary uppercase tracking-wider mb-2">
                  Quest Preparation
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track your daily habits and earn XP
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/skills">
                  <Button
                    variant="outline"
                    className="border-border hover:bg-muted text-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Skills
                  </Button>
                </Link>
                <CreateHabitDialog />
              </div>
            </div>
          </div>

          {/* Habit Heatmap Grid - 2x2 */}
          <div className="mb-12">
            <h2 className="text-lg font-gothic text-foreground uppercase tracking-wider mb-4">
              Habit Tracker
            </h2>
            {displayHabits.length === 0 ? (
              <div className="system-panel p-12 text-center">
                <p className="text-muted-foreground mb-4">No habits yet. Create your first habit to get started!</p>
                <CreateHabitDialog />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggleCompletion={handleToggleCompletion}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quest Section - 2x2 */}
          {displayHabits.length > 0 && (
            <div>
              <h2 className="text-lg font-gothic text-foreground uppercase tracking-wider mb-4">
                Active Quests
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayHabits.map((habit) => (
                  <QuestCard key={habit.id} habit={habit} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-64 border-l border-border/30 p-6 space-y-2">
          <div className="mb-8">
            <h3 className="font-gothic text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Navigation
            </h3>
          </div>

          {/* Navigation Items */}
          <Link to="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-left hover-glow hover:text-primary"
            >
              <Home className="w-4 h-4 mr-3" />
              Return Home
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start text-left hover-glow hover:text-primary border-l-2 border-primary bg-primary/5"
          >
            <Swords className="w-4 h-4 mr-3" />
            Awakening
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-left hover-glow hover:text-primary"
          >
            <Target className="w-4 h-4 mr-3" />
            Habits
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-left hover-glow hover:text-primary"
          >
            <Trophy className="w-4 h-4 mr-3" />
            Habit Goals
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-left hover-glow hover:text-primary"
          >
            <Calendar className="w-4 h-4 mr-3" />
            Completed
          </Button>

          <div className="pt-4 border-t border-border/30 mt-4">
            <Link to="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start text-left hover-glow hover:text-primary"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Habits;
