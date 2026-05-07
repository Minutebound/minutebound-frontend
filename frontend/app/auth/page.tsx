"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { travelApi } from "../../services/api";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  PlaneTakeoff,
  Loader2,
  Key,
  CheckCircle2,
  AlertCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isVerifyMode, setIsVerifyMode] = useState(false); 
  
  const [resetStep, setResetStep] = useState<"email" | "verify">("email");
  const [resetCode, setResetCode] = useState("");
  
  const [successMessage, setSuccessMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [emailOtp, setEmailOtp] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
  }>({});
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth() as any;
  const router = useRouter();

  const clearMessages = () => {
    setGlobalError("");
    setSuccessMessage("");
    setInfoMessage("");
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const countryCodeRegex = /^\+\d{1,4}$/;

    if (!email.trim()) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!isForgotMode && !isVerifyMode) {
      if (!isLogin) {
        if (firstName.trim().length < 2) {
          errors.firstName = "Required (min 2).";
          isValid = false;
        }
        if (lastName.trim().length < 2) {
          errors.lastName = "Required (min 2).";
          isValid = false;
        }
        if (phoneCountryCode && !countryCodeRegex.test(phoneCountryCode)) {
          errors.phoneCountryCode = "Invalid format (e.g. +1).";
          isValid = false;
        }
        if (phoneNumber && phoneNumber.trim().length < 7) {
          errors.phoneNumber = "Min 7 digits.";
          isValid = false;
        }
      }

      if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleLoginSuccess = async (token: string, fallbackEmail: string) => {
    localStorage.setItem("token", token);
    let displayUsername = fallbackEmail;
    try {
      const profile = await travelApi.getProfile();
      if (profile.first_name) {
         displayUsername = `${profile.first_name} ${profile.last_name || ''}`.trim();
      } else {
         displayUsername = profile.full_name || profile.name || profile.email || fallbackEmail;
      }
    } catch (profileErr) {
      console.warn("Could not fetch profile, falling back to email");
    }
    auth.login(token, displayUsername, fallbackEmail);
    router.push("/");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await travelApi.login(email, password);
        if (!res.access_token) throw new Error("No access token received.");
        await handleLoginSuccess(res.access_token, email);
      } else {
        await travelApi.signup({
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || undefined,
          email: email,
          password: password,
          phone_country_code: phoneNumber ? phoneCountryCode : undefined,
          phone_number: phoneNumber || undefined,
        });
        
        setInfoMessage("Account created! Please verify your email.");
        setIsVerifyMode(true);
      }
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      
      // Handle the unverified user login attempt
      if (errorDetail === "UNVERIFIED_EMAIL") {
        setInfoMessage("Your email isn't verified yet. We just sent a fresh code to your inbox!");
        setIsVerifyMode(true);
      } else {
        // Will properly display "User not found" or "User already exists" or "Incorrect password"
        setGlobalError(
          errorDetail || err.message || "Authentication failed. Please check your credentials."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      if (!emailOtp || emailOtp.length !== 6) {
         throw new Error("Please enter the 6-digit email OTP.");
      }
      
      // Verify Email
      await travelApi.verifyEmailOtp({ email, code: emailOtp });

      setInfoMessage("");
      setSuccessMessage("Account verified! Logging you in...");
      
      // Automatically log them in after a successful verify
      const res = await travelApi.login(email, password);
      await handleLoginSuccess(res.access_token, email);

    } catch (err: any) {
      setGlobalError(
        err.response?.data?.detail || err.message || "Verification failed. Check your code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (resetStep === "email") {
        await travelApi.forgotPassword(email);
        setInfoMessage("If an account exists, a code was sent to your email!");
        setResetStep("verify");
      } else {
        if (!resetCode || password.length < 6) {
          throw new Error("Please enter the code and a new password (min 6 chars).");
        }
        await travelApi.resetPassword(email, resetCode, password);
        setSuccessMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          setIsForgotMode(false);
          setResetStep("email");
          setPassword("");
          setResetCode("");
          clearMessages();
        }, 3000);
      }
    } catch (err: any) {
      setGlobalError(err.response?.data?.detail || err.message || "Action failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (fieldErrors[field as keyof typeof fieldErrors]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className="min-h-screen flex w-full font-sans bg-theme-bg">
      <div className="hidden lg:flex w-1/2 relative bg-theme-text overflow-hidden items-end justify-start pb-20 pl-16">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
          alt="Beautiful travel destination"
          className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-[20s] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-text/95 via-theme-text/40 to-transparent"></div>
        <div className="relative z-10 max-w-lg text-theme-bg animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-bg/10 backdrop-blur-md border border-theme-bg/20 text-xs font-bold uppercase tracking-widest mb-6">
            <SparkleIcon /> Smart Planning
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            Your next great adventure,{" "}
            <span className="text-theme-accent">planned in seconds.</span>
          </h1>
          <p className="text-lg text-theme-bg/80 font-medium">
            Let us craft a perfect itinerary tailored to your unique travel style.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center relative p-6 sm:p-12 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-theme-primary/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-theme-secondary/10 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-theme-text tracking-tight">
              <PlaneTakeoff className="text-theme-primary" size={32} strokeWidth={2.5} />
              WanderPlan <span className="text-theme-primary">US</span>
            </Link>
          </div>

          <div className="hidden lg:block mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-extrabold text-theme-text tracking-tight">
              {!isForgotMode
                ? isVerifyMode
                  ? "Verify Email"
                  : isLogin
                  ? "Welcome back"
                  : "Create an account"
                : "Reset Password"}
            </h2>
            <p className="text-theme-muted mt-2 text-sm font-medium">
              {!isForgotMode
                ? isVerifyMode
                  ? "Enter the code sent to your email address."
                  : isLogin
                  ? "Enter your details to access your trips."
                  : "Start planning your dream vacation today."
                : "Follow the steps to regain access to your account."}
            </p>
          </div>

          <div className="bg-theme-surface/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {!isForgotMode && !isVerifyMode && (
              <div className="flex bg-theme-bg p-1 rounded-2xl mb-8 relative border border-theme-surface">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-theme-surface rounded-xl shadow-sm transition-all duration-300 ease-out ${isLogin ? "left-1" : "left-[calc(50%+2px)]"}`}></div>
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); clearMessages(); setFieldErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-300 z-10 ${isLogin ? "text-theme-text" : "text-theme-muted hover:text-theme-text"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); clearMessages(); setFieldErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-300 z-10 ${!isLogin ? "text-theme-text" : "text-theme-muted hover:text-theme-text"}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            <form onSubmit={isForgotMode ? handleForgotSubmit : isVerifyMode ? handleVerifySubmit : handleAuthSubmit} className="flex flex-col gap-4">
              
              {globalError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
                  <AlertCircle size={16} /> {globalError}
                </div>
              )}
              
              {infoMessage && (
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl text-center animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
                  <AlertCircle size={16} /> {infoMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-xl text-center animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> {successMessage}
                </div>
              )}

              {!isLogin && !isForgotMode && !isVerifyMode && (
                <>
                  <div className="flex gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex-1 relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${fieldErrors.firstName ? "text-red-400" : "text-theme-muted group-focus-within:text-theme-primary"}`}>
                        <UserIcon size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={handleInputChange(setFirstName, "firstName")}
                        className={`w-full pl-10 pr-3 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.firstName ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"}`}
                      />
                      {fieldErrors.firstName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 absolute -bottom-5 left-0">{fieldErrors.firstName}</p>}
                    </div>

                    <div className="flex-1 relative group">
                      <input
                        type="text"
                        placeholder="Middle (Opt)"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-theme-bg border border-theme-secondary/30 rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="animate-in slide-in-from-top-2 fade-in duration-300 mt-2">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={handleInputChange(setLastName, "lastName")}
                        className={`w-full px-4 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.lastName ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"}`}
                      />
                      {fieldErrors.lastName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 absolute -bottom-5 left-0">{fieldErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-300 mt-2">
                    <div className="w-[80px] relative group">
                      <input
                        type="text"
                        placeholder="+1"
                        value={phoneCountryCode}
                        onChange={handleInputChange(setPhoneCountryCode, "phoneCountryCode")}
                        className={`w-full px-3 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-center text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.phoneCountryCode ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"}`}
                      />
                      {fieldErrors.phoneCountryCode && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 absolute -bottom-5 left-0 whitespace-nowrap">{fieldErrors.phoneCountryCode}</p>}
                    </div>
                    <div className="flex-1 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors text-theme-muted group-focus-within:text-theme-primary">
                        <Phone size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Phone Number (Optional)"
                        value={phoneNumber}
                        onChange={handleInputChange(setPhoneNumber, "phoneNumber")}
                        className={`w-full pl-10 pr-3 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.phoneNumber ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"}`}
                      />
                      {fieldErrors.phoneNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 absolute -bottom-5 left-0">{fieldErrors.phoneNumber}</p>}
                    </div>
                  </div>
                </>
              )}

              {!isVerifyMode && (
                <>
                  <div className={!isLogin && !isForgotMode ? "mt-2" : ""}>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${fieldErrors.email ? "text-red-400" : "text-theme-muted group-focus-within:text-theme-primary"}`}>
                        <Mail size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Email Address"
                        value={email}
                        disabled={isForgotMode && resetStep === "verify"}
                        onChange={handleInputChange(setEmail, "email")}
                        className={`w-full pl-11 pr-4 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.email ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"} ${isForgotMode && resetStep === "verify" ? "opacity-60 cursor-not-allowed bg-theme-surface" : ""}`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">{fieldErrors.email}</p>}
                  </div>

                  {(!isForgotMode || resetStep === "verify") && (
                    <div className="animate-in fade-in duration-300">
                      <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${fieldErrors.password ? "text-red-400" : "text-theme-muted group-focus-within:text-theme-primary"}`}>
                          <Lock size={18} />
                        </div>
                        <input
                          type="password"
                          placeholder={isForgotMode ? "Enter New Password" : "Password"}
                          value={password}
                          onChange={handleInputChange(setPassword, "password")}
                          className={`w-full pl-11 pr-4 py-3.5 bg-theme-bg border rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:bg-theme-bg transition-all ${fieldErrors.password ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-theme-secondary/30 focus:ring-theme-primary/20 focus:border-theme-primary"}`}
                        />
                      </div>
                      {fieldErrors.password && <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">{fieldErrors.password}</p>}
                    </div>
                  )}
                </>
              )}

              {/* ----- OTP VERIFICATION FIELDS (Only Email) ----- */}
              {isVerifyMode && (
                <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-theme-muted group-focus-within:text-theme-primary">
                      <Mail size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="6-Digit Email Code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-theme-bg border border-theme-secondary/30 rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-all tracking-widest"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {isForgotMode && resetStep === "verify" && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-theme-muted group-focus-within:text-theme-primary">
                      <Key size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="6-Digit Code from Email"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-theme-bg border border-theme-secondary/30 rounded-xl text-sm font-medium text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-all tracking-widest"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {isLogin && !isForgotMode && !isVerifyMode && (
                <div className="flex justify-end mt-[-8px] animate-in fade-in duration-300">
                  <button type="button" onClick={() => { setIsForgotMode(true); clearMessages(); }} className="text-xs font-bold text-theme-primary hover:text-theme-secondary transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-theme-primary hover:bg-theme-secondary text-theme-bg rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-theme-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {!isForgotMode ? isVerifyMode ? "Verify Email" : isLogin ? "Sign In" : "Create Account" : resetStep === "email" ? "Send Reset Code" : "Verify & Reset Password"}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {(isForgotMode || isVerifyMode) && (
                <div className="flex justify-center mt-2 animate-in fade-in duration-300">
                  <button type="button" onClick={() => { setIsForgotMode(false); setIsVerifyMode(false); setResetStep("email"); setEmailOtp(""); clearMessages(); }} className="text-xs font-bold text-theme-muted hover:text-theme-text transition-colors">
                    Back to login
                  </button>
                </div>
              )}
            </form>

            {!isForgotMode && !isVerifyMode && (
              <>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-theme-surface"></div>
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Or continue with</span>
                  <div className="flex-1 h-px bg-theme-surface"></div>
                </div>
                <div className="mt-6">
                  <button type="button" className="w-full flex items-center justify-center gap-3 py-3 bg-theme-bg border border-theme-secondary/30 hover:bg-theme-surface hover:border-theme-secondary/50 rounded-xl text-sm font-bold text-theme-text transition-all shadow-sm active:scale-[0.98]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Google
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-accent">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}