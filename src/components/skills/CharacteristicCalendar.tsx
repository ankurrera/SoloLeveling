import { useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCharacteristicAttendance, CharacteristicAttendance } from "@/hooks/useCharacteristicAttendance";
import { getConsistencyStatusMessage } from "@/lib/consistencyCalculations";
import { Characteristic } from "@/hooks/useCharacteristics";

interface CharacteristicCalendarProps {
  characteristic: Characteristic;
}

const CharacteristicCalendar = ({ characteristic }: CharacteristicCalendarProps) => {
  const { attendanceRecords, markAttendance } = useCharacteristicAttendance(characteristic.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate calendar grid for current month
  const generateCalendarGrid = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const grid: (Date | null)[][] = [];
    let currentDay = 1;
    
    for (let week = 0; week < 6; week++) {
      const weekDays: (Date | null)[] = [];
      
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDayOfWeek) {
          weekDays.push(null);
        } else if (currentDay > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(new Date(year, month, currentDay));
          currentDay++;
        }
      }
      
      grid.push(weekDays);
      
      if (currentDay > daysInMonth) break;
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getAttendanceForDate = (date: Date): CharacteristicAttendance | undefined => {
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
    <div className="space-y-3">
      {/* Header with consistency status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
          <h4 className="text-xs font-medium text-foreground">{monthName}</h4>
        </div>
        <div className="text-xs text-muted-foreground">
          {getConsistencyStatusMessage(characteristic.consistency_state, characteristic.current_streak)}
        </div>
      </div>

      {/* Streak display */}
      <div className="flex gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Streak: </span>
          <span className="font-medium">{characteristic.current_streak}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Best: </span>
          <span className="font-medium">{characteristic.best_streak}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-[10px] text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className="w-6 h-6" />;
              }
              
              const attendance = getAttendanceForDate(date);
              const isAttended = !!attendance;
              const isFuture = isFutureDate(date);
              const isGoalMet = attendance && attendance.time_spent_minutes >= characteristic.goal_minutes;
              
              return (
                <button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  disabled={isFuture}
                  className={`
                    w-6 h-6 rounded-sm border flex items-center justify-center
                    transition-all text-[10px]
                    ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    ${isAttended
                      ? isGoalMet
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted border-border/50'
                      : 'border-border/30 hover:border-border/50'
                    }
                  `}
                >
                  {isAttended && (
                    <div className={`w-1.5 h-1.5 rounded-full ${
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
      <div className="text-xs text-muted-foreground border-t border-border/30 pt-2">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{characteristic.goal_minutes} min/{characteristic.goal_type === 'daily' ? 'day' : 'week'}</span>
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
                placeholder={`Goal: ${characteristic.goal_minutes} min`}
                className="bg-input border-border"
                min="0"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your goal: {characteristic.goal_minutes} minutes
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

export default CharacteristicCalendar;