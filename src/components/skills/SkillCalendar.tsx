import { useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSkillAttendance, SkillAttendance } from "@/hooks/useSkillAttendance";
import { getConsistencyStatusMessage } from "@/lib/consistencyCalculations";
import { Skill } from "@/hooks/useSkills";

interface SkillCalendarProps {
  skill: Skill;
}

const SkillCalendar = ({ skill }: SkillCalendarProps) => {
  const { attendanceRecords, markAttendance } = useSkillAttendance(skill.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate calendar grid for current month
  const generateCalendarGrid = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const grid: (Date | null)[][] = [];
    let currentDay = 1;
    
    // Create weeks
    for (let week = 0; week < 6; week++) {
      const weekDays: (Date | null)[] = [];
      
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDayOfWeek) {
          // Empty cell before month starts
          weekDays.push(null);
        } else if (currentDay > daysInMonth) {
          // Empty cell after month ends
          weekDays.push(null);
        } else {
          // Valid day
          weekDays.push(new Date(year, month, currentDay));
          currentDay++;
        }
      }
      
      grid.push(weekDays);
      
      // Stop if we've filled the month
      if (currentDay > daysInMonth) break;
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  
  // Get month name
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Check if a date has attendance
  const getAttendanceForDate = (date: Date): SkillAttendance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.find(r => r.attendance_date === dateStr);
  };

  const isFutureDate = (date: Date) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date > todayStart;
  };

  const handleDateClick = (date: Date) => {
    if (isFutureDate(date)) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    
    // Pre-fill time if attendance exists
    const existing = getAttendanceForDate(date);
    setTimeSpent(existing ? existing.time_spent_minutes.toString() : "");
    
    setIsDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!selectedDate || !timeSpent) return;
    
    markAttendance.mutate(
      {
        attendance_date: selectedDate,
        time_spent_minutes: parseInt(timeSpent),
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedDate(null);
          setTimeSpent("");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with consistency status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">{monthName}</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {getConsistencyStatusMessage(skill.consistency_state, skill.current_streak)}
        </div>
      </div>

      {/* Streak display */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Current Streak:</span>
          <span className="font-medium text-foreground">{skill.current_streak} days</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Best Streak:</span>
          <span className="font-medium text-foreground">{skill.best_streak} days</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className="aspect-square" />;
              }
              
              const attendance = getAttendanceForDate(date);
              const isAttended = !!attendance;
              const isFuture = isFutureDate(date);
              const isGoalMet = attendance && attendance.time_spent_minutes >= skill.goal_minutes;
              
              return (
                <button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  disabled={isFuture}
                  className={`
                    aspect-square rounded border flex flex-col items-center justify-center
                    transition-all text-xs
                    ${isFuture ? 'opacity-30 cursor-not-allowed bg-muted/30' : 'cursor-pointer'}
                    ${isAttended
                      ? isGoalMet
                        ? 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                        : 'bg-muted border-border/50 hover:bg-muted/80'
                      : 'border-border/30 hover:border-border/50 hover:bg-muted/30'
                    }
                  `}
                >
                  <span className={`${isAttended ? 'font-medium' : ''}`}>
                    {date.getDate()}
                  </span>
                  {isAttended && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${
                      isGoalMet ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Goal info */}
      <div className="text-xs text-muted-foreground border-t border-border/30 pt-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            Goal: {skill.goal_minutes} minutes {skill.goal_type === 'daily' ? 'per day' : 'per week'}
          </span>
        </div>
      </div>

      {/* Attendance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Date
              </label>
              <Input
                type="date"
                value={selectedDate || ""}
                disabled
                className="bg-muted border-border"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Time Spent (minutes) *
              </label>
              <Input
                type="number"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder={`Goal: ${skill.goal_minutes} min`}
                className="bg-input border-border"
                min="0"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your goal: {skill.goal_minutes} minutes
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAttendance}
                disabled={!timeSpent || markAttendance.isPending}
                className="flex-1"
              >
                {markAttendance.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillCalendar;