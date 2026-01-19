import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { Calendar, Clock, Zap, TrendingUp, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { format } from "date-fns";
import InlineWorkoutLogger from "./InlineWorkoutLogger";

const SessionHistory = () => {
  const { sessions, isLoading, calculateStats } = useWorkoutSessions();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="system-panel">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = calculateStats(sessions);

  // If editing a session, show the editor
  if (editingSession) {
    return (
      <Card className="system-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Workout Session</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSession(null)}
            >
              Back to History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InlineWorkoutLogger
            sessionId={editingSession}
            onComplete={() => setEditingSession(null)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="system-panel hover-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-gothic">
          <TrendingUp className="w-5 h-5 text-primary" />
          SYSTEM LOG
        </CardTitle>
        <CardDescription className="uppercase tracking-[0.15em] text-xs">
          Training Session Records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Overview - Horizontal System Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-4 border-b border-primary/20">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Total XP</div>
            <div className="text-2xl font-bold text-accent">{stats.totalXP}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Training Time</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalHours}h</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">Consistency</div>
            <div className="text-2xl font-bold text-foreground">{Math.round(stats.consistency)}%</div>
          </div>
        </div>

        {/* Recent Sessions - Log Console Format */}
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2 uppercase tracking-[0.15em] text-xs">No training logs found</p>
              <p className="text-sm">Initialize first session to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium mb-3 uppercase tracking-[0.15em] text-primary">System Logs</div>
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/70"
                >
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setExpandedSession(
                      expandedSession === session.id ? null : session.id
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium font-system">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          [{format(new Date(session.session_date), 'yyyy.MM.dd')}]
                        </span>
                        <span className="text-primary">▸</span>
                        <span className="text-foreground">Training Session Complete</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground font-system">
                        {session.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration_minutes}m
                          </span>
                        )}
                        {session.notes && (
                          <span className="truncate max-w-[200px] italic">"{session.notes}"</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-accent font-system">
                        ⚡ +{session.total_xp_earned || 0} XP
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSession(session.id);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      {expandedSession === session.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedSession === session.id && (
                    <div className="border-t border-primary/10 px-3 py-2 bg-background/50 text-xs">
                      <p className="text-muted-foreground italic font-system">
                        → Access full session data via Edit function
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {sessions.length > 10 && (
                <div className="text-center text-xs text-muted-foreground pt-3 uppercase tracking-wider">
                  + {sessions.length - 10} additional log entries
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
