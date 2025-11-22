// =============================================
// Dashboard.jsx — Fully Fixed & Clean Version
// =============================================

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
import { http } from "@/lib/api";

/* motion variants */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

/* Helpers */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const addDays = (d, n) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};

const daysDiff = (a, b) =>
  Math.max(
    0,
    Math.round(
      (new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)) /
        86400000
    )
  );

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();

  /* Auth header */
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  /* -----------------------------------------
     USER NAME
  ------------------------------------------ */
  const [userName, setUserName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?.name || u?.fullName || u?.username || u?.email || "";
    } catch {
      return "";
    }
  });

  const firstNameOf = (s) => {
    if (!s) return "";
    const raw = String(s).trim();
    if (raw.includes(" ")) return raw.split(" ")[0];
    if (raw.includes("@")) return raw.split("@")[0];
    return raw;
  };

  // Fetch user if needed
  useEffect(() => {
    if (!token) return;
    if (userName && userName.length > 1) return;

    (async () => {
      try {
        const tryMe = (path) =>
          http.get(path, {
            headers: authHeader,
            validateStatus: (s) => s === 200 || s === 404,
          });

        let data = null;

        let r = await tryMe("/auth/me");
        if (r.status === 200) data = r.data;

        if (!data) {
          r = await tryMe("/users/me");
          if (r.status === 200) data = r.data;
        }

        if (data) {
          const pretty =
            data.name || data.fullName || data.username || data.email || "";
          if (pretty) {
            setUserName(pretty);
            const cached = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...cached,
                name: pretty,
                email: data.email || cached.email,
              })
            );
          }
        }
      } catch {}
    })();
  }, [token, authHeader, userName]);

  /* -----------------------------------------
     TOPICS + DOCUMENTS
  ------------------------------------------ */
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [latestDoc, setLatestDoc] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsOpen, setTopicsOpen] = useState(false);

  /* -----------------------------------------
     VIDEOS
  ------------------------------------------ */
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  const fetchLatestDocAndTopics = useCallback(async () => {
    if (!token) {
      setLatestDoc(null);
      setTopics([]);
      setVideos([]);
      return;
    }

    setTopicsLoading(true);

    try {
      const { data: docs } = await http.get("/documents/mine", {
        headers: authHeader,
      });

      const latest = Array.isArray(docs) && docs.length ? docs[0] : null;
      setLatestDoc(latest);
      setVideos([]);

      if (!latest) {
        setTopics([]);
        return;
      }

      const { data: t } = await http.get(`/topics/by-document/${latest._id}`, {
        headers: authHeader,
      });

      setTopics(Array.isArray(t) ? t : t?.topics || []);
    } catch (e) {
      toast({
        title: "Couldn’t load topics",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  }, [authHeader, token, toast]);

  useEffect(() => {
    fetchLatestDocAndTopics();
  }, [fetchLatestDocAndTopics]);

  const fetchVideos = useCallback(
    async (id) => {
      if (!id) return setVideos([]);
      setVideosLoading(true);
      try {
        const { data } = await http.get(`/videos/by-document/${id}`, {
          headers: authHeader,
          validateStatus: (s) => s === 200 || s === 404,
        });
        setVideos(Array.isArray(data) ? data : []);
      } catch {
        setVideos([]);
      } finally {
        setVideosLoading(false);
      }
    },
    [authHeader]
  );

  useEffect(() => {
    if (latestDoc?._id) fetchVideos(latestDoc._id);
  }, [latestDoc, fetchVideos]);

  /* -----------------------------------------
     STUDY PLAN + TOPIC SELECTION
  ------------------------------------------ */
  const [selected, setSelected] = useState({});
  const [pace, setPace] = useState("moderate");
  const [dueDate, setDueDate] = useState(
    addDays(new Date(), 7).toISOString().slice(0, 10)
  );
  const [sessions, setSessions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [upcomingSession, setUpcomingSession] = useState(null);

  /* Progress stats */
  const [studyStats, setStudyStats] = useState({ completed: 0, total: 0 });
  const [plannerStats, setPlannerStats] = useState({ completed: 0, total: 0 });
  const [hybridProgress, setHybridProgress] = useState(0);

  /* Load saved study plan */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studyPlan");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.sessions)) setSessions(saved.sessions);
    } catch {}
  }, []);

  /* Load planner tasks */
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("plannerTasks") || localStorage.getItem("tasks");

      if (!raw) return;

      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;

      const total = arr.length;
      const completed = arr.filter(
        (t) => t.completed || t.done || t.checked
      ).length;

      setPlannerStats({ completed, total });
    } catch {}
  }, []);

  /* Study session completion stats */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studyPlan");
      const saved = raw ? JSON.parse(raw) : null;

      const allSessions = sessions.length
        ? sessions
        : Array.isArray(saved?.sessions)
        ? saved.sessions
        : [];

      if (!allSessions.length) {
        setStudyStats({ completed: 0, total: 0 });
        return;
      }

      // FIXED: JS only (NO TYPESCRIPT)
      const completedIds = new Set(
        saved?.completedSessionIds || saved?.completed || []
      );

      const completed = allSessions.filter(
        (s) => s.completed || s.done || completedIds.has(s.id)
      ).length;

      setStudyStats({ completed, total: allSessions.length });
    } catch {
      setStudyStats({ completed: 0, total: 0 });
    }
  }, [sessions]);

  /* Upcoming session */
  useEffect(() => {
    if (!sessions.length) {
      setUpcomingSession(null);
      return;
    }
    const today = new Date().setHours(0, 0, 0, 0);
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const next =
      sorted.find((s) => new Date(s.date).setHours(0, 0, 0, 0) >= today) ||
      sorted[0];
    setUpcomingSession(next || null);
  }, [sessions]);

  /* Hybrid progress */
  useEffect(() => {
    const topicTotal = topics.length;
    const topicCompleted = Object.values(selected).filter(Boolean).length;

    const ratios = [];

    if (studyStats.total) ratios.push(studyStats.completed / studyStats.total);

    if (plannerStats.total)
      ratios.push(plannerStats.completed / plannerStats.total);

    if (topicTotal) ratios.push(topicCompleted / topicTotal);

    const avg =
      ratios.length === 0
        ? 0
        : ratios.reduce((a, b) => a + b, 0) / ratios.length;

    setHybridProgress(Math.round(avg * 100));
  }, [studyStats, plannerStats, topics.length, selected]);

  /* Toggle topic selection */
  const toggleTopic = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  /* Generate study sessions */
  const estimateMinutes = (t) => {
    const words = (t?.summary || "").split(/\s+/).length;
    let base = 25 + Math.min(35, Math.floor(words / 20));
    const factor = pace === "fast" ? 0.7 : pace === "slow" ? 1.3 : 1;
    return Math.max(10, Math.round(base * factor));
  };

  const generatePlan = () => {
    const chosen = topics.filter((t) => selected[t._id || t.title]);
    if (!chosen.length)
      return toast({
        title: "Pick at least one topic",
        variant: "destructive",
      });

    const start = new Date();
    const end = new Date(dueDate);
    if (Number.isNaN(end.getTime()))
      return toast({
        title: "Select a valid due date",
        variant: "destructive",
      });

    setGenerating(true);

    const spanDays = Math.max(1, daysDiff(start, end) + 1);

    const out = chosen.map((t, i) => {
      const dayIndex = Math.floor((i * spanDays) / chosen.length);
      const date = addDays(start, dayIndex);
      return {
        id: `${t._id || t.title}::${i}`,
        date: date.toISOString(),
        dateLabel: fmtDate(date),
        topic: t.title || t.name,
        minutes: estimateMinutes(t),
      };
    });

    setSessions(out);
    setGenerating(false);
  };

  /* Save study plan */
  const savePlan = () => {
    const chosen = topics.filter((t) => selected[t._id || t.title]);

    const payload = {
      createdAt: new Date().toISOString(),
      dueDate,
      pace,
      sessions,
      sourceDocument: latestDoc?._id || null,
      topics: chosen.map((t) => t.title || t.name),
    };

    localStorage.setItem("studyPlan", JSON.stringify(payload));

    toast({
      title: "Study plan saved",
      description: `Sessions: ${sessions.length}`,
    });
  };

  /* Topic stats */
  const topicCompletedCount = Object.values(selected).filter(Boolean).length;
  const topicTotalCount = topics.length;

  /* -----------------------------------------
     RENDER
  ------------------------------------------ */

  return (
    <>
      <Helmet>
        <title>Dashboard | LearnAI</title>
      </Helmet>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {firstNameOf(userName) || "there"}!
            </h1>
            <p className="text-muted-foreground">
              Let's make today a productive one.
            </p>
          </div>

          <Button
            onClick={() => navigate("/upload")}
            className="bg-primary text-primary-foreground"
          >
            <FilePlus2 className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </motion.div>

        {/* ---------- PROGRESS SECTION ---------- */}
        <motion.div
          variants={itemVariants}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* HYBRID PROGRESS CARD */}
          <Card className="glassmorphic-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Overall Progress</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">{hybridProgress}%</div>
              <p className="text-xs text-muted-foreground">
                Based on Study Sessions, Planner Tasks & Topic Reviews.
              </p>

              <div className="mt-3 text-[11px] text-muted-foreground space-y-1">
                <div>
                  Study Plan:{" "}
                  <span className="font-medium">
                    {studyStats.completed}/{studyStats.total}
                  </span>
                </div>
                <div>
                  Planner Tasks:{" "}
                  <span className="font-medium">
                    {plannerStats.completed}/{plannerStats.total}
                  </span>
                </div>
                <div>
                  Topics Reviewed:{" "}
                  <span className="font-medium">
                    {topicCompletedCount}/{topicTotalCount}
                  </span>
                </div>
              </div>

              <Progress value={hybridProgress} className="mt-4 h-2" />
            </CardContent>
          </Card>

          {/* TOPICS CARD */}
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
                  ? "Loading..."
                  : latestDoc
                  ? `From: ${latestDoc.originalName || latestDoc._id}`
                  : "Upload a document to see topics"}
              </p>

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
                      {latestDoc?.originalName}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-80 overflow-auto space-y-2">
                    {topicsLoading ? (
                      <p>Loading…</p>
                    ) : topics.length ? (
                      topics.map((t) => {
                        const id = t._id || t.title;
                        return (
                          <div
                            key={id}
                            className="p-3 rounded bg-secondary/50 flex justify-between"
                          >
                            <div>
                              <p className="font-medium">{t.title}</p>
                              {t.summary && (
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {t.summary}
                                </p>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={!!selected[id]}
                              onChange={() => toggleTopic(id)}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <p>No topics found.</p>
                    )}
                  </div>

                  <DialogFooter className="mt-3 flex justify-between">
                    <Button
                      variant="secondary"
                      onClick={fetchLatestDocAndTopics}
                    >
                      Refresh
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button disabled={!topics.length}>
                          📅 Create Study Plan
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Create Study Plan</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label>Study Pace</label>
                            <select
                              className="w-full p-2 rounded bg-background border"
                              value={pace}
                              onChange={(e) => setPace(e.target.value)}
                            >
                              <option value="fast">Fast</option>
                              <option value="moderate">Moderate</option>
                              <option value="slow">Slow</option>
                            </select>
                          </div>

                          <div>
                            <label>Due Date</label>
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full p-2 rounded bg-background border"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={generatePlan}
                            disabled={!Object.values(selected).includes(true)}
                          >
                            Generate
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={savePlan}
                            disabled={!sessions.length}
                          >
                            Save
                          </Button>
                        </div>

                        <div className="max-h-64 overflow-auto mt-4 space-y-2">
                          {sessions.length ? (
                            sessions.map((s) => (
                              <div
                                key={s.id}
                                className="p-3 rounded bg-secondary/50 flex justify-between"
                              >
                                <div>
                                  <p className="font-medium">{s.topic}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Est. {s.minutes} min
                                  </p>
                                </div>
                                <p className="text-xs">{s.dateLabel}</p>
                              </div>
                            ))
                          ) : (
                            <p>No sessions yet.</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* UPCOMING SESSION */}
          <Card className="glassmorphic-card md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Study Session</CardTitle>
              <CardDescription>
                {upcomingSession
                  ? `On ${fmtDate(upcomingSession.date)}`
                  : "No upcoming sessions"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {upcomingSession ? (
                <div className="p-4 bg-secondary/50 rounded flex flex-col">
                  <p className="font-medium">{upcomingSession.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    Est. {upcomingSession.minutes} minutes
                  </p>
                  <Button
                    onClick={() => navigate("/planner")}
                    className="mt-2"
                    size="sm"
                    variant="secondary"
                  >
                    Go to Planner
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-secondary/50 rounded">
                  <p>No study sessions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* QUICK ACTIONS */}
        <motion.div className="grid gap-6 lg:grid-cols-3">
          <Card className="glassmorphic-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* AI Summarizer */}
              <Dialog>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="p-4 bg-secondary/50 rounded cursor-pointer text-center"
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
                    <DialogTitle>AI Summarizer</DialogTitle>
                  </DialogHeader>
                  <Textarea rows={8} placeholder="Paste text..." />
                  <DialogFooter>
                    <Button onClick={() => toast({ title: "Coming soon ✨" })}>
                      Summarize
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Planner */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-secondary/50 rounded cursor-pointer text-center"
                onClick={() => navigate("/planner")}
              >
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">View Planner</p>
              </motion.div>

              {/* Videos */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-secondary/50 rounded cursor-pointer text-center"
                onClick={() => toast({ title: "Coming soon ✨" })}
              >
                <Video className="h-8 w-8 text-primary mb-2" />
                <p className="font-semibold">Find Videos</p>
              </motion.div>
            </CardContent>
          </Card>

          {/* UPCOMING TASK CARD (STATIC PLACEHOLDER) */}
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Upcoming Task</CardTitle>
              <CardDescription>From your Planner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary/50 rounded">
                <p>No tasks loaded yet.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* VIDEOS */}
        <motion.div>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Recommended Videos</CardTitle>
              <CardDescription>
                {latestDoc
                  ? `Based on: ${latestDoc.originalName}`
                  : "Upload a document to get videos"}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videosLoading ? (
                <p>Loading...</p>
              ) : videos.length ? (
                videos.map((v) => (
                  <motion.a
                    key={v.videoId}
                    whileHover={{ y: -5 }}
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-secondary/50 rounded block"
                  >
                    <div className="aspect-video rounded mb-2 bg-muted overflow-hidden">
                      {v.thumbnail && (
                        <img
                          src={v.thumbnail}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="font-semibold line-clamp-2">{v.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {v.channelTitle}
                    </p>
                  </motion.a>
                ))
              ) : (
                <p>No recommendations yet.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
