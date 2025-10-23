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

// Use env var when available; fallback to localhost (no TS-only syntax)
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL &&
    import.meta.env.VITE_API_URL.replace(/\/+$/, "")) ||
  "http://localhost:3001";

// Small axios instance
const http = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // set true only if you use http-only cookies
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const AuthPage = () => {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const friendlyError = (err, fallback = "Something went wrong") => {
    const isHtml =
      err?.response?.headers?.["content-type"]?.includes?.("text/html");
    if (isHtml) return "Server crashed while handling your request (500).";
    return err?.response?.data?.message || err?.message || fallback;
  };

  // Store tokens in a way that works with the rest of your app (supports both keys)
  const persistSession = (data) => {
    if (!data) return;
    const token = data.accessToken || data.token;
    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token); // many routers check this
    }
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await http.post("/auth/login", { email, password });
      persistSession(data);
      toast({
        title: "Welcome back 👋",
        description: `Logged in as ${data?.user?.email || email}`,
      });
      // ⚠️ Use the exact route casing you defined elsewhere
      navigate("/Dashboard"); // redirect after login only
    } catch (err) {
      toast({
        title: "Login failed",
        description: friendlyError(
          err,
          "Check your credentials and try again."
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sign-up no longer auto-logs in or redirects
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/auth/register", { name, email, password });

      toast({
        title: "Account created 🎉",
        description: "You can now sign in with your credentials.",
      });

      // Switch to Sign In tab; keep email so user just types password again
      setTab("signin");
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: friendlyError(
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
