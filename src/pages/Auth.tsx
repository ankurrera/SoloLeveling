import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return false;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return false;
      }
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back, Hunter');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Registration complete. Arise!');
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* System Panel */}
        <div className="system-panel p-8 animate-fade-in-up">
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 corner-decoration corner-tl" />
          <div className="absolute top-2 right-2 corner-decoration corner-tr" />
          <div className="absolute bottom-2 left-2 corner-decoration corner-bl" />
          <div className="absolute bottom-2 right-2 corner-decoration corner-br" />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-gothic text-3xl font-bold text-glow mb-2">
              {isLogin ? 'HUNTER LOGIN' : 'AWAKENING'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Access the System' : 'Begin Your Journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="stat-label">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border focus:border-primary"
                placeholder="hunter@system.io"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="stat-label">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-fade-in-up">
                <Label htmlFor="confirmPassword" className="stat-label">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-6 glow-border hover-glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? 'ENTER SYSTEM' : 'AWAKEN'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? " : 'Already awakened? '}
              <span className="text-primary font-semibold">
                {isLogin ? 'Awaken Now' : 'Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
