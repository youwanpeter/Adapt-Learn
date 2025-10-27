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
import { Bot, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ---------- API base resolver (always ensures one /api) ---------- */
const resolveApiBase = () => {
  const raw =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL &&
      String(import.meta.env.VITE_API_URL).trim()) ||
    "http://localhost:4000";
  const noTrail = raw.replace(/\/+$/, "");
  return /\/api$/.test(noTrail) ? noTrail : `${noTrail}/api`;
};

const API_BASE = resolveApiBase();

/* ---------- Axios instance ---------- */
const http = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // set true only if you use http-only cookies
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 10000,
});

// Dev visibility
if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.log("AuthPage using API_BASE:", API_BASE);
}

/* Helpful network-aware error message */
const normalizeError = (err, fallback = "Something went wrong") => {
  // Axios network error (server not running, wrong port, CORS preflight blocked at network layer)
  if (!err.response) {
    // eslint-disable-next-line no-console
    console.error("Network/connection error:", err);
    return `Cannot reach API at ${API_BASE}. Is the backend running? (${
      err.code || "NETWORK"
    })`;
  }
  const isHtml =
    err?.response?.headers?.["content-type"]?.includes?.("text/html");
  if (isHtml) return "Server crashed while handling your request (500).";
  return err?.response?.data?.message || err?.message || fallback;
};

// Optional health check before we send auth requests (fast fail)
const pingHealth = async () => {
  try {
    await http.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

const AuthPage = () => {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Save token + prime axios for subsequent authorized requests
  const persistSession = (data) => {
    if (!data) return;
    const token = data.accessToken || data.token;
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await pingHealth();
      if (!ok) {
        throw new Error(
          `API not reachable at ${API_BASE}. Start backend or fix VITE_API_URL.`
        );
      }
      // POST /api/auth/login -> { token, user }
      const { data } = await http.post("/auth/login", { email, password });
      persistSession(data);
      toast({
        title: "Welcome back 👋",
        description: `Logged in as ${data?.user?.email || email}`,
      });
      navigate("/dashboard"); // adjust if your route differs
    } catch (err) {
      toast({
        title: "Login failed",
        description: normalizeError(
          err,
          "Check your credentials and try again."
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign-up does NOT auto-login; it swaps to Sign In
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await pingHealth();
      if (!ok) {
        throw new Error(
          `API not reachable at ${API_BASE}. Start backend or fix VITE_API_URL.`
        );
      }
      // POST /api/auth/register -> 201/200
      await http.post("/auth/register", { name, email, password });
      toast({
        title: "Account created 🎉",
        description: "You can now sign in with your credentials.",
      });
      setTab("signin");
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: normalizeError(
          err,
          "Unable to create your account right now."
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableSubmit =
    loading ||
    !email?.trim() ||
    !password?.trim() ||
    (tab === "signup" && !name?.trim());

  return (
    <>
      <Helmet>
        <title>Authentication | LearnAI</title>
        <meta name="description" content="Sign in or create an account." />
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
          className="z-10"
        >
          <div className="flex justify-center mb-8">
            <Bot className="h-16 w-16 text-primary" />
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v)}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In */}
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
                    <div className="space-y-2">
                      <Label htmlFor="email-signin">Email</Label>
                      <Input
                        id="email-signin"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signin">Password</Label>
                      <Input
                        id="password-signin"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        autoComplete="current-password"
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

            {/* Sign Up */}
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
                    <div className="space-y-2">
                      <Label htmlFor="name-signup">Name</Label>
                      <Input
                        id="name-signup"
                        type="text"
                        placeholder="Your Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Password</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        autoComplete="new-password"
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
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;
