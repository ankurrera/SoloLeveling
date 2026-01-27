import PlayerStatusPanel from "@/components/system/PlayerStatusPanel";

const TestHeroCard = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Notion-Style Hero Card</h1>
        <PlayerStatusPanel />
      </div>
    </div>
  );
};

export default TestHeroCard;
