import SystemHeader from "@/components/system/SystemHeader";
import PlayerStatusPanel from "@/components/system/PlayerStatusPanel";
import RadarChart from "@/components/system/RadarChart";
import SkillPointsPanel from "@/components/system/SkillPointsPanel";
import CalendarPanel from "@/components/system/CalendarPanel";
import GoalPanel from "@/components/system/GoalPanel";
import PotionsPanel from "@/components/system/PotionsPanel";
import CornerDecoration from "@/components/system/CornerDecoration";

const Index = () => {
  const radarData = [
    { label: "STR", value: 65 },
    { label: "END", value: 55 },
    { label: "MOB", value: 45 },
    { label: "REC", value: 70 },
    { label: "CON", value: 80 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />
      
      {/* Corner Decorations */}
      <CornerDecoration className="inset-0 z-10" />

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <SystemHeader />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-8">
          {/* Left Column - Player Status */}
          <div className="lg:col-span-3">
            <PlayerStatusPanel />
          </div>

          {/* Center Column - Radar Chart */}
          <div className="lg:col-span-5">
            <RadarChart data={radarData} />
          </div>

          {/* Right Column - Skill Points */}
          <div className="lg:col-span-4">
            <SkillPointsPanel />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Calendar */}
          <CalendarPanel />
          
          {/* Goals */}
          <GoalPanel />
        </div>

        {/* Potions Section */}
        <div className="mt-4">
          <PotionsPanel />
        </div>

        {/* Footer Decoration */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="w-2 h-2 rotate-45 border border-primary/50" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
