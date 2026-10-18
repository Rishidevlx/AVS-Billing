import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { Input, Checkbox, Button } from '../components/ui';
import { showToast, showAlert } from '../utils/alert';
import loginIllustration from '../assets/login.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast('Please enter both username/email and password', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save authenticated session token & user info
      const authToken = data.accessToken || 'auth_active_session';
      localStorage.setItem('auth_token', authToken);
      if (data.user) {
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        if (data.user.fullName || data.user.username) {
          localStorage.setItem('logged_in_user_name', data.user.fullName || data.user.username);
        }
      }

      // Successful login toast & redirect to dashboard panel
      showToast(data.message || 'Signed in successfully!', 'success');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryPassword = () => {
    showAlert({
      title: 'Reset Password',
      text: 'For security reasons, password resets must be authorized by your billing software administrator.',
      icon: 'info',
      confirmButtonText: 'Understood',
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#EFF2F6] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-['Nunito',sans-serif]">
      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-[#FFFFFF] rounded-[32px] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] p-4 sm:p-5 lg:p-7 flex flex-col md:flex-row items-center gap-8 lg:gap-12">
        
        {/* Left Side: 3D Illustration Container (No hover scale effect) */}
        <div className="w-full md:w-1/2 h-[340px] sm:h-[420px] md:h-[540px] rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#FFF5EC] via-[#FFF9F5] to-[#FEEFDF] border border-[#FFE7D3] flex items-center justify-center relative p-6 sm:p-8 overflow-hidden">
          {/* Ambient Lighting Glows */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#FE9F43]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#FE9F43]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Pill */}
          <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-white/80 flex items-center gap-2 z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FE9F43]"></span>
            <span className="text-[12px] font-bold text-[#212B36] tracking-wide">
              Rinvox Billing
            </span>
          </div>

          {/* 3D Illustration (Static without hover transform) */}
          <img
            src={loginIllustration}
            alt="Billing Software Illustration"
            className="max-h-full max-w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.08)] select-none z-0"
          />
        </div>

        {/* Right Side: Reusable Component Based Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-2 sm:px-6 lg:px-8 py-2 md:py-6">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-[28px] font-bold text-[#212B36] tracking-tight">
              Hello Again!
            </h1>
            <p className="text-[14px] font-medium text-[#646B72] mt-1.5">
              Welcome back you've been missed!
            </p>
          </div>

          {/* Reusable Form Components */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email Field */}
            <Input
              id="username-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter username"
              leftIcon={FiMail}
              autoComplete="username"
            />

            {/* Password Field with Toggle */}
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              leftIcon={FiLock}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#646B72] hover:text-[#212B36] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-[17px]" />
                  ) : (
                    <FiEye className="text-[17px]" />
                  )}
                </button>
              }
            />

            {/* Remember Me Outline Checkbox & Recovery Link */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Remember me"
                variant="primary"
              />

              <button
                type="button"
                onClick={handleRecoveryPassword}
                className="text-[13px] font-semibold text-[#646B72] hover:text-[#FE9F43] transition-colors cursor-pointer"
              >
                Recovery Password
              </button>
            </div>

            {/* Sign In Button Component */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                rightIcon={FiArrowRight}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
