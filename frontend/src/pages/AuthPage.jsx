import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
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
import { useNavigate } from "react-router-dom";
import { http } from "@/lib/api";

/* ---------- Utility ---------- */
const normalizeError = (err, fallback = "Something went wrong") => {
  if (!err?.response) return fallback;
  const isHtml =
    err?.response?.headers?.["content-type"]?.includes?.("text/html");
  if (isHtml) return "Server error.";
  return err?.response?.data?.message || err?.message || fallback;
};

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("signin");
  const [phase, setPhase] = useState("form"); // "form" | "verifyEmail" | "verifyLogin"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const persistSession = (data) => {
    const token = data?.accessToken || data?.token;
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
    }
    if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
  };

  const disableSubmit =
    loading ||
    !email?.trim() ||
    !password?.trim() ||
    (tab === "signup" && !name?.trim());

  // REGISTER → send OTP
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/auth/register", { name, email, password });
      setPhase("verifyEmail");
      setPendingEmail(email);
      setOtp("");
      toast({
        title: "Verification required",
        description: "We sent a code to your email.",
      });
    } catch (err) {
      toast({
        title: "Sign-up failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // VERIFY email
  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/auth/verify-email", { email: pendingEmail, code: otp });
      toast({
        title: "Email verified 🎉",
        description: "You can now sign in.",
      });
      setPhase("form");
      setTab("signin");
    } catch (err) {
      toast({
        title: "Verification failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // LOGIN → request OTP
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await http.post("/auth/login", { email, password });
      setPhase("verifyLogin");
      setTempToken(data.tempToken);
      setPendingEmail(email);
      setOtp("");
      toast({
        title: "OTP sent",
        description: "Check your email for the 6-digit code.",
      });
    } catch (err) {
      toast({
        title: "Login failed",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // VERIFY login
  const verifyLoginOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await http.post("/auth/login/verify", {
        tempToken,
        code: otp,
      });
      persistSession(data);
      toast({
        title: "Welcome back 👋",
        description: `Logged in as ${data?.user?.email || pendingEmail}`,
      });
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Invalid OTP",
        description: normalizeError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (purpose) => {
    try {
      await http.post("/auth/resend-otp", { email: pendingEmail, purpose });
      toast({ title: "OTP resent", description: "Check your email again." });
    } catch (err) {
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

          {phase === "form" && (
            <Tabs value={tab} onValueChange={(v) => setTab(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card className="glassmorphic-card">
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
                        )}{" "}
                        Sign In
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="glassmorphic-card">
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
                        )}{" "}
                        Sign Up
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

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
                    >
                      Resend Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

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
