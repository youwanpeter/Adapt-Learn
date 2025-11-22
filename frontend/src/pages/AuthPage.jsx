// frontend/src/pages/AuthPage.jsx
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Loader2, MailCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { http } from "@/lib/api";

/* ---------- Utility ---------- */
const normalizeError = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;

  const resp = err.response;
  if (!resp) return err.message || fallback;

  const headers = resp.headers || {};
  const contentType =
    headers["content-type"] ||
    headers["Content-Type"] ||
    headers["Content-type"];

  // If backend accidentally sends HTML (Express error), hide it
  if (typeof contentType === "string" && contentType.includes("text/html")) {
    return "Server error.";
  }

  // If express-validator style errors: { errors: [{ msg, param }...] }
  if (Array.isArray(resp.data?.errors) && resp.data.errors.length) {
    return resp.data.errors.map((e) => e.msg).join(", ");
  }

  return resp.data?.message || err.message || fallback;
};

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("signin");
  // "form" | "verifyEmail" | "verifyLogin"
  const [phase, setPhase] = useState("form");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // for login OTP step
  const [tempToken, setTempToken] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const persistSession = (data) => {
    const token = data?.accessToken || data?.token;
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
    }
    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  };

  const disableSubmit =
    loading ||
    !email.trim() ||
    !password.trim() ||
    (tab === "signup" && !name.trim());

  /* ========== SIGN UP (step 1: register → email OTP) ========== */
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setPhase("verifyEmail");
      setPendingEmail(email.trim());
      setOtp("");

      toast({
        title: "Verification required",
        description: "We sent a 6-digit code to your email.",
      });
    } catch (err) {
      console.error("register error:", err?.response?.data || err);
      toast({
        title: "Sign-up failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ========== SIGN UP (step 2: verify email OTP) ========== */
  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    const code = otp.trim();

    if (code.length < 4) {
      toast({
        title: "Invalid code",
        description: "Please enter the code from your email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { email: pendingEmail, code };
      console.log("🔐 verify-email request:", payload);
      const { data } = await http.post("/auth/verify-email", payload);
      console.log("🔐 verify-email response:", data);

      toast({
        title: "Email verified 🎉",
        description: "You can now sign in.",
      });

      setPhase("form");
      setTab("signin");
      setOtp("");
    } catch (err) {
      console.error("verify-email error:", err?.response?.data || err);
      toast({
        title: "Verification failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ========== SIGN IN (step 1: password → send OTP) ========== */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { email: email.trim(), password };
      console.log("🔐 login request:", payload);
      const { data } = await http.post("/auth/login", payload);
      console.log("🔐 login response:", data);

      // backend should return { tempToken, ... }
      setPhase("verifyLogin");
      setTempToken(data.tempToken);
      setPendingEmail(email.trim());
      setOtp("");

      toast({
        title: "OTP sent",
        description: "Check your email for the 6-digit code.",
      });
    } catch (err) {
      console.error("login error:", err?.response?.data || err);
      toast({
        title: "Login failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ========== SIGN IN (step 2: verify login OTP) ========== */
  const verifyLoginOtp = async (e) => {
    e.preventDefault();
    const code = otp.trim();

    if (!tempToken) {
      toast({
        title: "Session expired",
        description: "Please sign in again.",
        variant: "destructive",
      });
      setPhase("form");
      setTab("signin");
      return;
    }

    if (code.length < 4) {
      toast({
        title: "Invalid code",
        description: "Please enter the code you received.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { tempToken, code };
      console.log("🔐 login/verify request:", payload);
      const { data } = await http.post("/auth/login/verify", payload);
      console.log("🔐 login/verify response:", data);

      persistSession(data);

      toast({
        title: "Welcome back 👋",
        description: `Logged in as ${data?.user?.email || pendingEmail}`,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("login/verify error:", err?.response?.data || err);
      toast({
        title: "Invalid OTP",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ========== RESEND OTP (both flows) ========== */
  const resendOtp = async (purpose) => {
    if (!pendingEmail) {
      toast({
        title: "No email found",
        description: "Please complete the previous step again.",
        variant: "destructive",
      });
      return;
    }
    try {
      const payload = { email: pendingEmail, purpose };
      console.log("🔐 resend-otp request:", payload);
      const { data } = await http.post("/auth/resend-otp", payload);
      console.log("🔐 resend-otp response:", data);

      toast({
        title: "OTP resent",
        description: "Check your email again.",
      });
    } catch (err) {
      console.error("resend-otp error:", err?.response?.data || err);
      toast({
        title: "Resend failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Authentication | LearnAI</title>
      </Helmet>

      <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* animated background */}
        <motion.div
          className="absolute inset-0 z-0 aurora-bg"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-[400px]"
        >
          <div className="flex justify-center mb-8">
            <Bot className="h-16 w-16 text-primary" />
          </div>

          {/* ========== PHASE: SIGN-IN / SIGN-UP FORMS ========== */}
          {phase === "form" && (
            <Tabs value={tab} onValueChange={(v) => setTab(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* SIGN IN TAB */}
              <TabsContent value="signin">
                <Card className="glassmorphic-card mt-4">
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={disableSubmit}
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SIGN UP TAB */}
              <TabsContent value="signup">
                <Card className="glassmorphic-card mt-4">
                  <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>
                      Enter your details to get started.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={disableSubmit}
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign Up
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* ========== PHASE: VERIFY EMAIL AFTER SIGNUP ========== */}
          {phase === "verifyEmail" && (
            <Card className="glassmorphic-card">
              <CardHeader>
                <MailCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Verify your Email</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <b>{pendingEmail}</b>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={verifyEmailOtp} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Verify Email"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resendOtp("verify_email")}
                      disabled={loading}
                    >
                      Resend Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ========== PHASE: VERIFY LOGIN OTP ========== */}
          {phase === "verifyLogin" && (
            <Card className="glassmorphic-card">
              <CardHeader>
                <MailCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Enter Login Code</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <b>{pendingEmail}</b>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={verifyLoginOtp} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Continue"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resendOtp("login")}
                      disabled={loading}
                    >
                      Resend Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;
