import { useState } from "react";
import { Skill } from "@/hooks/useSkills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import SkillCard from "./SkillCard";
import CreateSkillForm from "./CreateSkillForm";

interface SkillsGridProps {
  skills: Skill[];
}

const SkillsGrid = ({ skills }: SkillsGridProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === "all" ||
                         (filterActive === "active" && skill.is_active) ||
                         (filterActive === "inactive" && !skill.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-normal text-muted-foreground">
            Skills – Areas
          </h2>
          
          {/* Filter */}
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterActive("all")}
              className={`h-7 px-3 text-xs ${
                filterActive === "all"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterActive("active")}
              className={`h-7 px-3 text-xs ${
                filterActive === "active"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterActive("inactive")}
              className={`h-7 px-3 text-xs ${
                filterActive === "inactive"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inactive
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="pl-9 w-64 bg-input border-border"
            />
          </div>

          {/* New Skill Button */}
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="border-border hover:bg-muted"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Skill
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <CreateSkillForm onClose={() => setIsCreating(false)} />
      )}

      {/* Skills Grid */}
      {filteredSkills.length === 0 && !isCreating ? (
        <div className="system-panel p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterActive !== "all"
              ? "No skills match your filters"
              : "No skills yet. Create your first skill to get started!"}
          </p>
          {!searchQuery && filterActive === "all" && (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="border-border hover:bg-muted"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Skill
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsGrid;
