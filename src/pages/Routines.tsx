import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import CornerDecoration from "@/components/system/CornerDecoration";
import RoutineList from "@/components/routines/RoutineList";
import CreateRoutineDialog from "@/components/routines/CreateRoutineDialog";

const Routines = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />
      
      {/* Corner Decorations */}
      <CornerDecoration className="inset-0 z-10" />

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 pb-12">
        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" className="hover-glow text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="hover-glow text-muted-foreground hover:text-primary">
              <Settings className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary tracking-wider uppercase">
            Quest Preparations
          </h1>
          <p className="text-muted-foreground">
            Plan your training routines before battle
          </p>
        </div>

        {/* Create Routine Button */}
        <div className="flex justify-center mb-8">
          <Button
            className="w-full sm:w-auto uppercase tracking-[0.1em] hover-glow"
            size="lg"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Routine
          </Button>
        </div>

        {/* Routine List */}
        <RoutineList />

        {/* Create Routine Dialog */}
        <CreateRoutineDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </div>
  );
};

export default Routines;
