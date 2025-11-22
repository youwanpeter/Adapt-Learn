// src/pages/Planner.jsx
import React from "react";
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
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { useToast } from "@/components/ui/use-toast";

/* ---------- helpers ---------- */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const loadPlan = () => {
  try {
    const raw = localStorage.getItem("studyPlan");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadProgress = () => {
  try {
    const raw = localStorage.getItem("studyPlanProgress");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProgress = (p) =>
  localStorage.setItem("studyPlanProgress", JSON.stringify(p));

const loadTasks = () => {
  try {
    const raw = localStorage.getItem("plannerTasks");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks) =>
  localStorage.setItem("plannerTasks", JSON.stringify(tasks));

/* ---------- MAIN COMPONENT ---------- */
const Planner = () => {
  const { toast } = useToast();

  const [date, setDate] = React.useState(new Date());

  /* sessions (from Study Plan) */
  const [plan, setPlan] = React.useState(null);
  const [progress, setProgress] = React.useState({});

  /* custom tasks */
  const [tasks, setTasks] = React.useState([]);

  const showToast = (msg) => {
    toast({
      title: "Planner",
      description: msg,
    });
  };

  /* ---------- load everything on mount ---------- */
  const refresh = React.useCallback(() => {
    const p = loadPlan();
    setPlan(p);

    const pr = loadProgress();
    setProgress(pr);

    const t = loadTasks();
    setTasks(t);

    if (p)
      showToast(
        `Loaded Study Plan (${p.sessions?.length || 0} sessions, due ${fmtDate(
          p.dueDate
        )})`
      );
  }, []);

  React.useEffect(() => {
    refresh();

    /* listen for dashboard changes */
    const onStorage = (e) => {
      if (
        e.key === "studyPlan" ||
        e.key === "studyPlanProgress" ||
        e.key === "plannerTasks"
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  /* ---------- session completion ---------- */
  const toggleSession = (id) => {
    setProgress((curr) => {
      const next = { ...curr, [id]: !curr[id] };
      saveProgress(next);
      return next;
    });
  };

  const clearProgress = () => {
    saveProgress({});
    setProgress({});
    showToast("Cleared all study progress.");
  };

  const removePlan = () => {
    localStorage.removeItem("studyPlan");
    localStorage.removeItem("studyPlanProgress");
    setPlan(null);
    setProgress({});
    showToast("Removed study plan.");
  };

  /* ---------- custom tasks ---------- */
  const addTask = (e) => {
    e.preventDefault();
    const text = e.target.task.value;
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const next = [...tasks, newTask];
    setTasks(next);
    saveTasks(next);

    e.target.reset();
    showToast("Task added.");
  };

  const toggleTask = (id) => {
    const next = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(next);
    saveTasks(next);
  };

  const deleteTask = (id) => {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    saveTasks(next);
    showToast("Task removed.");
  };

  /* ---------- group sessions by date ---------- */
  const sessionsByDate = React.useMemo(() => {
    if (!plan?.sessions) return {};
    const map = {};
    for (const s of plan.sessions) {
      const key = new Date(s.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [plan]);

  const selectedDateKey = date.toDateString();
  const sessionsForSelectedDate = sessionsByDate[selectedDateKey] || [];

  const daysWithSessions = new Set(Object.keys(sessionsByDate));

  return (
    <>
      <Helmet>
        <title>Planner | LearnAI</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* ---------- HEADER ---------- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Planner</h1>
            <p className="text-muted-foreground">
              Manage your study schedule & personal tasks.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={refresh}>
              Reload
            </Button>

            {/* Add Task */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              </DialogTrigger>

              <DialogContent>
                <form onSubmit={addTask}>
                  <DialogHeader>
                    <DialogTitle>Add a New Task</DialogTitle>
                    <DialogDescription>
                      What do you need to do?
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <Input
                      name="task"
                      placeholder="e.g. Finish Chapter 6 notes"
                      required
                    />
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="submit">Add Task</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---------- LEFT COLUMN (Sessions + Tasks) ---------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* ---- Study Sessions ---- */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Study Plan Sessions</CardTitle>
                <CardDescription>
                  {plan
                    ? `Due ${fmtDate(plan.dueDate)} • ${
                        plan.sessions.length
                      } sessions`
                    : "No study plan found — create one from Dashboard"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {plan?.sessions?.length ? (
                  <div className="space-y-3">
                    {plan.sessions.map((s) => {
                      const done = !!progress[s.id];
                      return (
                        <div
                          key={s.id}
                          className="flex justify-between items-center bg-secondary/40 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={done}
                              onCheckedChange={() => toggleSession(s.id)}
                            />
                            <div>
                              <p
                                className={`font-medium ${
                                  done
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {s.topic}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fmtDate(s.date)} • {s.minutes} min
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No sessions available.
                  </p>
                )}

                {plan && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" onClick={clearProgress}>
                      Clear Progress
                    </Button>
                    <Button variant="ghost" onClick={removePlan}>
                      Remove Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---- Personal Tasks ---- */}
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Task List</CardTitle>
                <CardDescription>
                  {tasks.filter((t) => !t.completed).length} pending task(s)
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {tasks.length ? (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center bg-secondary/40 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div>
                            <p
                              className={`font-medium ${
                                task.completed
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {task.text}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(task.createdAt)}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tasks yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---------- RIGHT COLUMN (Calendar) ---------- */}
          <div className="space-y-6">
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>
                  <CalendarIcon className="h-5 w-5 inline mr-2" />
                  Calendar
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  modifiers={{
                    studyDay: (day) => daysWithSessions.has(day.toDateString()),
                  }}
                  modifiersClassNames={{
                    studyDay:
                      "bg-primary/40 text-primary-foreground rounded-full",
                  }}
                />

                {/* sessions list */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sessions on {fmtDate(date)}:
                  </p>

                  {sessionsForSelectedDate.length ? (
                    sessionsForSelectedDate.map((s) => {
                      const done = !!progress[s.id];
                      return (
                        <div
                          key={s.id}
                          className="p-3 bg-secondary/40 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={done}
                              onCheckedChange={() => toggleSession(s.id)}
                            />
                            <div>
                              <p className="text-sm font-medium">{s.topic}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.minutes} min
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No sessions this day.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Planner;
