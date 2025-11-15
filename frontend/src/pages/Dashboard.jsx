// src/pages/Dashboard.jsx
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

/* tiny date helpers */
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

  /* auth header */
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  /* 🔹 USER NAME (new) */
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

  // try to fetch user if not cached
  useEffect(() => {
    if (!token) return;
    if (userName && userName.length > 1) return; // already have name

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
      } catch {
        /* non-critical */
      }
    })();
  }, [token, authHeader, userName]);

  /* topics */
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [latestDoc, setLatestDoc] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsOpen, setTopicsOpen] = useState(false);

  /* videos */
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
      // newest first assumed by your /documents/mine endpoint
      const { data: docs } = await http.get("/documents/mine", {
        headers: authHeader,
      });
      const latest = Array.isArray(docs) && docs.length ? docs[0] : null;

      setLatestDoc(latest);
      setVideos([]); // reset while loading

      if (!latest) {
        setTopics([]);
        return;
      }

      const { data: t } = await http.get(`/topics/by-document/${latest._id}`, {
        headers: authHeader,
      });
      setTopics(Array.isArray(t) ? t : t?.topics || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load topics.";
      setLatestDoc(null);
      setTopics([]);
      setVideos([]);
      toast({
        title: "Couldn’t load topics",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setTopicsLoading(false);
    }
  }, [authHeader, token, toast]);

  /* initial load */
  useEffect(() => {
    fetchLatestDocAndTopics();
  }, [fetchLatestDocAndTopics]);

  /* refresh when an upload finishes */
  useEffect(() => {
    const onNewDoc = () => {
      setLatestDoc(null);
      setTopics([]);
      setVideos([]);
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

  /* fetch video recs only when we have a doc id */
  const fetchVideos = useCallback(
    async (docId) => {
      if (!docId || !token) {
        setVideos([]);
        return;
      }
      setVideosLoading(true);
      try {
        const { data } = await http.get(`/videos/by-document/${docId}`, {
          headers: authHeader,
          validateStatus: (s) => s === 200 || s === 404, // treat 404 as empty
        });
        setVideos(Array.isArray(data) ? data : []);
      } catch {
        setVideos([]); // non-critical
      } finally {
        setVideosLoading(false);
      }
    },
    [authHeader, token]
  );

  useEffect(() => {
    if (latestDoc?._id) fetchVideos(latestDoc._id);
  }, [latestDoc?._id, fetchVideos]);

  /* ===== Study planner ===== */
  const [selected, setSelected] = useState({});
  const [pace, setPace] = useState("moderate");
  const [dueDate, setDueDate] = useState(() =>
    addDays(new Date(), 7).toISOString().slice(0, 10)
  );
  const [sessions, setSessions] = useState([]);
  const [generating, setGenerating] = useState(false);

  const toggleTopic = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allSelectedTopics = topics.filter((t) => selected[t._id || t.title]);
  const estimateMinutes = (t) => {
    const words = (t?.summary || "").split(/\s+/).filter(Boolean).length;
    let base = 25 + Math.min(35, Math.floor(words / 20)); // 25–60
    const factor = pace === "fast" ? 0.75 : pace === "slow" ? 1.3 : 1.0;
    return Math.max(10, Math.round(base * factor));
  };
  const generatePlan = () => {
    if (!allSelectedTopics.length) {
      toast({ title: "Pick at least one topic", variant: "destructive" });
      return;
    }
    const start = new Date();
    const end = new Date(dueDate);
    if (Number.isNaN(end.getTime())) {
      toast({ title: "Select a valid due date", variant: "destructive" });
      return;
    }
    setGenerating(true);
    const spanDays = Math.max(1, daysDiff(start, end) + 1);
    const out = allSelectedTopics.map((t, i) => {
      const dayIndex = Math.floor((i * spanDays) / allSelectedTopics.length);
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
  const savePlan = () => {
    const payload = {
      createdAt: new Date().toISOString(),
      dueDate,
      pace,
      sessions,
      sourceDocument: latestDoc?._id || null,
      topics: allSelectedTopics.map((t) => t.title || t.name),
    };
    localStorage.setItem("studyPlan", JSON.stringify(payload));
    toast({
      title: "Study plan saved ✅",
      description: `Sessions: ${sessions.length}`,
    });
  };

  const showToast = () => toast({ title: "Coming soon ✨" });

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
        {/* header */}
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <FilePlus2 className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </motion.div>

        {/* progress + topics */}
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
                      {topics.map((t) => {
                        const id = t._id || t.title;
                        return (
                          <li
                            key={id}
                            className="p-3 rounded-md bg-secondary/50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">
                                  {t.title || t.name}
                                </div>
                                {t.summary && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-3">
                                    {t.summary}
                                  </div>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                className="h-4 w-4 ml-3"
                                checked={!!selected[id]}
                                onChange={() => toggleTopic(id)}
                                title="Include in study plan"
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No topics found.
                    </p>
                  )}

                  <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
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
                          <DialogDescription>
                            Choose pace & due date. We’ll generate sessions with
                            estimated minutes.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium">
                              Study Pace
                            </label>
                            <select
                              className="w-full p-2 mt-1 rounded bg-background border"
                              value={pace}
                              onChange={(e) => setPace(e.target.value)}
                            >
                              <option value="fast">
                                Fast (shorter sessions)
                              </option>
                              <option value="moderate">
                                Moderate (default)
                              </option>
                              <option value="slow">Slow (deeper study)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Due Date
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 mt-1 rounded bg-background border"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              min={new Date().toISOString().slice(0, 10)}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Selected topics: {allSelectedTopics.length} /{" "}
                          {topics.length}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            onClick={generatePlan}
                            disabled={generating || !allSelectedTopics.length}
                          >
                            {generating ? "Generating…" : "Generate Plan"}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!sessions.length}
                            onClick={savePlan}
                          >
                            {sessions.length ? "Save Plan" : "Generate first"}
                          </Button>
                        </div>

                        <div className="mt-4 max-h-64 overflow-auto space-y-2">
                          {sessions.length ? (
                            sessions.map((s) => (
                              <div
                                key={s.id}
                                className="p-3 rounded bg-secondary/50 text-sm flex justify-between"
                              >
                                <div className="pr-3">
                                  <div className="font-medium">{s.topic}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Est. {s.minutes} min
                                  </div>
                                </div>
                                <div className="text-xs">{s.dateLabel}</div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No sessions yet — pick topics and click{" "}
                              <span className="font-medium">Generate Plan</span>
                              .
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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

        {/* quick actions */}
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
                className="flex flex-col items-center justify-center p-4 bg-secondary/50 hover	bg-secondary rounded-lg cursor-pointer text-center"
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

        {/* recommended videos */}
        <motion.div variants={itemVariants}>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Recommended Videos</CardTitle>
              <CardDescription>
                {latestDoc
                  ? `Based on: ${latestDoc.originalName || latestDoc._id}`
                  : "Upload a document to get recommendations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videosLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : videos.length ? (
                videos.map((v) => (
                  <motion.a
                    key={v.videoId}
                    whileHover={{ y: -5 }}
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-secondary/50 p-4 rounded-lg block"
                    title={v.title}
                  >
                    <div className="aspect-video rounded-md mb-3 overflow-hidden bg-muted">
                      {v.thumbnail ? (
                        <img
                          src={v.thumbnail}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="font-semibold line-clamp-2">{v.title}</p>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {v.channelTitle}
                    </div>
                  </motion.a>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  {latestDoc
                    ? "No recommendations yet. Try re-uploading or another document."
                    : "No videos yet."}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
