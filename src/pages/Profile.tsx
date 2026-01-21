import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Plus, Trash2, Shield, Target, Settings, User } from 'lucide-react';
import { toast } from 'sonner';

const PLAYER_CLASSES = [
  { id: 'warrior', name: 'Warrior', description: 'Strength & Power focused' },
  { id: 'assassin', name: 'Assassin', description: 'Speed & Agility focused' },
  { id: 'mage', name: 'Mage', description: 'Technique & Flexibility focused' },
  { id: 'tank', name: 'Tank', description: 'Endurance & Defense focused' },
  { id: 'healer', name: 'Healer', description: 'Recovery & Mobility focused' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const FOCUS_AREAS = ['strength', 'endurance', 'mobility', 'power', 'hypertrophy', 'conditioning'];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, goals, preferences, isLoading, updateProfile, updatePreferences, addGoal, deleteGoal } = useProfile();

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [playerClass, setPlayerClass] = useState('warrior');
  const [bio, setBio] = useState('');
  const [bodyweight, setBodyweight] = useState('');


  // Preferences state
  const [workoutFrequency, setWorkoutFrequency] = useState(4);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [restDayNotification, setRestDayNotification] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  // New goal state
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalUnit, setNewGoalUnit] = useState('kg');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPlayerClass(profile.player_class || 'warrior');
      setBio(profile.bio || '');
      setBodyweight(profile.bodyweight_kg ? profile.bodyweight_kg.toString() : '');
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setWorkoutFrequency(preferences.workout_frequency || 4);
      setPreferredDays(preferences.preferred_days || []);
      setRestDayNotification(preferences.rest_day_notification ?? true);
      setSessionDuration(preferences.session_duration_minutes || 60);
      setFocusAreas(preferences.focus_areas || []);
    }
  }, [preferences]);

  const handleSaveProfile = () => {
    updateProfile({
      display_name: displayName,
      player_class: playerClass,
      bio: bio,
      bodyweight_kg: bodyweight ? parseFloat(bodyweight) : null
    });
  };

  const handleSavePreferences = () => {
    updatePreferences({
      workout_frequency: workoutFrequency,
      preferred_days: preferredDays,
      rest_day_notification: restDayNotification,
      session_duration_minutes: sessionDuration,
      focus_areas: focusAreas
    });
  };

  const handleAddGoal = () => {
    if (!newGoalName.trim()) {
      toast.error('Please enter a goal name');
      return;
    }
    addGoal({
      name: newGoalName,
      description: null,
      target_value: newGoalTarget ? parseFloat(newGoalTarget) : null,
      current_value: 0,
      unit: newGoalUnit,
      deadline: null,
      is_completed: false
    });
    setNewGoalName('');
    setNewGoalTarget('');
  };

  const toggleDay = (day: string) => {
    setPreferredDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-system">Back to System</span>
          </button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Sign Out
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-gothic text-4xl font-bold text-glow mb-2">HUNTER PROFILE</h1>
          <p className="text-muted-foreground">Configure Your System Settings</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="w-4 h-4" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="system-panel p-6 space-y-6">
              <div className="space-y-2">
                <Label className="stat-label">Hunter Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-3">
                <Label className="stat-label">Player Class</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PLAYER_CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setPlayerClass(cls.id)}
                      className={`p-4 rounded-lg border transition-all text-left hover-glow ${
                        playerClass === cls.id
                          ? 'border-primary bg-primary/10 glow-border'
                          : 'border-border bg-muted/50 hover:border-primary/50'
                      }`}
                    >
                      <div className="font-gothic text-lg font-semibold mb-1">
                        {cls.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cls.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="stat-label">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-input border-border focus:border-primary min-h-24"
                  placeholder="Tell us about your training journey..."
                />
              </div>

              <div className="space-y-2">
                <Label className="stat-label">Bodyweight (kg)</Label>
                <Input
                  type="number"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                  placeholder="Enter your bodyweight in kg"
                  min="30"
                  max="250"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Used to calculate relative training load. Updates affect future sessions only.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2 glow-border">
                  <Save className="w-4 h-4" />
                  Save Profile
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <div className="system-panel p-6 space-y-6">
              {/* Add Goal Form */}
              <div className="space-y-4 pb-6 border-b border-border">
                <Label className="stat-label">Add New Goal</Label>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="flex-1 bg-input border-border focus:border-primary"
                    placeholder="Goal name (e.g., Bench Press)"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="w-24 bg-input border-border focus:border-primary"
                      placeholder="Target"
                    />
                    <select
                      value={newGoalUnit}
                      onChange={(e) => setNewGoalUnit(e.target.value)}
                      className="px-3 py-2 rounded-md bg-input border border-border text-foreground"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="reps">reps</option>
                      <option value="min">min</option>
                      <option value="days">days</option>
                      <option value="%">%</option>
                    </select>
                    <Button onClick={handleAddGoal} className="gap-2 glow-border">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Goals List */}
              <div className="space-y-3">
                <Label className="stat-label">Current Goals</Label>
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No goals set yet. Add your first goal above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{goal.name}</div>
                          {goal.target_value && (
                            <div className="text-sm text-muted-foreground">
                              {goal.current_value || 0} / {goal.target_value} {goal.unit}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {goal.target_value && (
                            <div className="w-32 h-2 bg-system-bar-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                                style={{ width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGoal(goal.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="system-panel p-6 space-y-6">
              {/* Workout Frequency */}
              <div className="space-y-3">
                <Label className="stat-label">Workout Frequency (days/week)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setWorkoutFrequency(num)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        workoutFrequency === num
                          ? 'bg-primary text-primary-foreground glow-border'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Days */}
              <div className="space-y-3">
                <Label className="stat-label">Preferred Training Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg capitalize transition-all ${
                        preferredDays.includes(day)
                          ? 'bg-primary text-primary-foreground glow-border'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration */}
              <div className="space-y-3">
                <Label className="stat-label">Session Duration: {sessionDuration} minutes</Label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 min</span>
                  <span>180 min</span>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label className="stat-label">Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleFocusArea(area)}
                      className={`px-4 py-2 rounded-lg capitalize transition-all ${
                        focusAreas.includes(area)
                          ? 'bg-accent text-accent-foreground glow-border'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rest Day Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <div className="font-semibold">Rest Day Reminders</div>
                  <div className="text-sm text-muted-foreground">Get notified on rest days</div>
                </div>
                <Switch
                  checked={restDayNotification}
                  onCheckedChange={setRestDayNotification}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} className="gap-2 glow-border">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
