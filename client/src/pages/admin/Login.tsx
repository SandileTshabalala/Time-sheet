import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import authService, { type LoginData } from '../../services/auth.service';

const Login = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();

  // Safeguard 1: On reaching /login, clear any stale user that has mustChangePassword=true
  useEffect(() => {
    const stored = authService.getCurrentUser() as any;
    if (stored?.mustChangePassword) {
      authService.logout();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginData) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      // Safeguard 2: If switching accounts (email changed), clear any existing session first
      const existing = authService.getCurrentUser();
      if (existing && existing.email && existing.email.toLowerCase() !== formData.email.toLowerCase()) {
        authService.logout();
      }

      const response = await authService.login(formData);
      // authService.login already persisted token, refresh token, and user
      const user = authService.getCurrentUser();
      const roles = user?.roles || response.user?.roles || [];

      // If backend requires password change, force redirect to change-password page
      const mustChange = user?.mustChangePassword ?? response.mustChangePassword ?? response.user?.mustChangePassword;
      if (mustChange) {
        navigate('/change-password');
        return;
      }

      // Role-based landing route
      if (roles.includes('SystemAdmin')) {
        navigate('/admin');
      } else if (roles.includes('HRAdmin')) {
        navigate('/hradmin');
      } else if (roles.includes('Manager')) {
        navigate('/manager');
      } else {
        navigate('/employee');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      console.log("Login response full:", err.response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-playfair font-bold text-foreground">Welcome Back</CardTitle>
        <CardDescription className="text-muted-foreground text-base">Sign in to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
       <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="pl-10 pr-10 h-12 bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center pt-4">
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Forgot your password?
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Login;