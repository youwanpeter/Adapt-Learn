import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  FilePlus2,
  Lightbulb,
  Zap,
  ArrowRight,
  Video,
  FileText,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ---------- API base resolver (adds /api exactly once) ---------- */
const resolveApiBase = () => {
  const raw =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL &&
      String(import.meta.env.VITE_API_URL).trim()) ||
    "http://127.0.0.1:4000";
  const base = raw.replace(/\/+$/, "");
  return /\/api$/.test(base) ? base : `${base}/api`;
};
const API_BASE = resolveApiBase();
const http = axios.create({ baseURL: API_BASE, timeout: 15000 });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const videoRecommendations = [
  {
    title: "Intro to Neural Networks",
    channel: "3Blue1Brown",
    duration: "19:27",
  },
  { title: "Support Vector Machines", channel: "StatQuest", duration: "23:45" },
  {
    title: "The Transformer Model",
    channel: "AI Explained",
    duration: "15:02",
  },
];

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  /* ---------- Topics from latest document ---------- */
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [latestDoc, setLatestDoc] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsOpen, setTopicsOpen] = useState(false);

  const fetchLatestDocAndTopics = useCallback(async () => {
    if (!token) {
      setLatestDoc(null);
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    setTopicsError("");
    try {
      // 1) fetch my docs (assume backend sorts desc; if not, sort here)
      const { data: docs } = await http.get("/documents/mine", {
        headers: authHeader,
      });
      const latest = Array.isArray(docs) && docs.length ? docs[0] : null;

      if (!latest) {
        setLatestDoc(null);
        setTopics([]);
        setTopicsLoading(false);
        return;
      }

      // 2) fetch topics for that doc
      const { data: t } = await http.get(`/topics/by-document/${latest._id}`, {
        headers: authHeader,
      });

      setLatestDoc(latest);
      setTopics(Array.isArray(t) ? t : t?.topics || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load topics.";
      setTopicsError(msg);
      setLatestDoc(null);
      setTopics([]);
      toast({
        title: "Couldn’t load topics",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setTopicsLoading(false);
    }
  }, [authHeader, token, toast]);

  // Initial load
  useEffect(() => {
    fetchLatestDocAndTopics();
  }, [fetchLatestDocAndTopics]);

  // React to new uploads (Upload.jsx dispatches 'last-uploaded-doc')
  useEffect(() => {
    const onNewDoc = () => {
      // Clear immediately for UX then refetch
      setLatestDoc(null);
      setTopics([]);
      fetchLatestDocAndTopics();
    };
    window.addEventListener("last-uploaded-doc", onNewDoc);
    const onStorage = (ev) => {
      if (ev.key === "lastUploadedDocId") onNewDoc();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("last-uploaded-doc", onNewDoc);
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchLatestDocAndTopics]);

  const showToast = () =>
    toast({
      title: "🚧 Feature not implemented",
      description:
        "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });

  return (
    <>
      <Helmet>
        <title>Dashboard | LearnAI</title>
        <meta
          name="description"
          content="Your personalized learning dashboard."
        />
      </Helmet>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, Alex!
            </h1>
            <p className="text-muted-foreground">
              Let's make today a productive one.
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <FilePlus2 className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <Card className="glassmorphic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Overall Progress</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
              <Progress value={75} className="mt-4 h-2" />
            </CardContent>
          </Card>

          {/* Topics to Review (wired to latest doc) */}
          <Card className="glassmorphic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Topics to Review</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topicsLoading ? "—" : topics.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {topicsLoading
                  ? "Loading from your latest document..."
                  : latestDoc
                  ? `From: ${latestDoc.originalName || latestDoc._id}`
                  : token
                  ? "Upload a document to see extracted topics"
                  : "Sign in to view topics"}
              </p>

              {/* View topics dialog */}
              <Dialog open={topicsOpen} onOpenChange={setTopicsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    className="p-0 mt-2 h-auto text-primary"
                    disabled={!topics.length || topicsLoading}
                  >
                    View Topics <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Extracted Topics</DialogTitle>
                    <DialogDescription>
                      {latestDoc
                        ? latestDoc.originalName || latestDoc._id
                        : "Latest document"}
                    </DialogDescription>
                  </DialogHeader>

                  {topicsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : topics.length ? (
                    <ul className="space-y-2 max-h-80 overflow-auto">
                      {topics.map((t) => (
                        <li
                          key={t._id || t.title}
                          className="p-3 rounded-md bg-secondary/50"
                        >
                          <div className="font-medium text-sm">
                            {t.title || t.name}
                          </div>
                          {t.summary && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {t.summary}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No topics found.
                    </p>
                  )}

                  <DialogFooter>
                    <Button
                      variant="secondary"
                      onClick={fetchLatestDocAndTopics}
                    >
                      Refresh
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="glassmorphic-card md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Next Milestone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold">Mid-term Exam Prep</div>
              <p className="text-xs text-muted-foreground">Due in 12 days</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => navigate("/planner")}
              >
                Go to Planner
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card className="glassmorphic-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center justify-center p-4 bg-secondary/50 hover:bg-secondary rounded-lg cursor-pointer text-center"
                  >
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <p className="font-semibold">AI Summarizer</p>
                    <p className="text-xs text-muted-foreground">
                      Summarize any text
                    </p>
                  </motion.div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Text Summarizer</DialogTitle>
                    <DialogDescription>
                      Paste your text below and let our AI provide a concise
                      summary.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea placeholder="Paste your text here..." rows={10} />
                  <DialogFooter>
                    <Button onClick={() => toast({ title: "Coming soon ✨" })}>
                      Summarize
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/planner")}
                className="flex flex-col items-center justify-center p-4 bg-secondary/50 hover:bg-secondary rounded-lg cursor-pointer text-center"
              >
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">View Planner</p>
                <p className="text-xs text-muted-foreground">
                  Manage your tasks
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => toast({ title: "Coming soon ✨" })}
                className="flex flex-col items-center justify-center p-4 bg-secondary/50 hover:bg-secondary rounded-lg cursor-pointer text-center"
              >
                <Video className="h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">Find Videos</p>
                <p className="text-xs text-muted-foreground">
                  Search learning content
                </p>
              </motion.div>
            </CardContent>
          </Card>

          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Upcoming Task</CardTitle>
              <CardDescription>Due Tomorrow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-1 self-start"></div>
                <div>
                  <p className="font-medium">Chapter 5 Quiz</p>
                  <p className="text-sm text-muted-foreground">History of AI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Recommended Videos</CardTitle>
              <CardDescription>
                Based on your recent activity in "Machine Learning"
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videoRecommendations.map((video, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  onClick={() => toast({ title: "Coming soon ✨" })}
                  className="bg-secondary/50 p-4 rounded-lg cursor-pointer"
                >
                  <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                    <Video className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="font-semibold truncate">{video.title}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                    <span>{video.channel}</span>
                    <span>{video.duration}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Dashboard;
