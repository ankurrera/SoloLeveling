import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSkills } from "@/hooks/useSkills";
import { useCharacteristics } from "@/hooks/useCharacteristics";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import CharacteristicsPanel from "@/components/skills/CharacteristicsPanel";
import SkillsGrid from "@/components/skills/SkillsGrid";
import QuickCreatePanel from "@/components/skills/QuickCreatePanel";

const Skills = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { skills } = useSkills();
  const { characteristics } = useCharacteristics();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover-glow text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-normal text-foreground">
                  Skills
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Quick Create Panel */}
        <div className="mb-6">
          <QuickCreatePanel />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Characteristics (30%) */}
          <div className="lg:col-span-4">
            <CharacteristicsPanel characteristics={characteristics} />
          </div>

          {/* Right Column - Skills Grid (70%) */}
          <div className="lg:col-span-8">
            <SkillsGrid skills={skills} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;
