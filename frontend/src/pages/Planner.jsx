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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const initialTasks = [
  {
    id: 1,
    text: "Finish Chapter 5 quiz for History of AI",
    completed: false,
    dueDate: "Tomorrow",
  },
  {
    id: 2,
    text: "Outline essay on Ethics in Machine Learning",
    completed: false,
    dueDate: "In 3 days",
  },
  {
    id: 3,
    text: "Read research paper on Quantum Computing",
    completed: true,
    dueDate: "Yesterday",
  },
  {
    id: 4,
    text: "Prepare presentation slides for project proposal",
    completed: false,
    dueDate: "In 5 days",
  },
];

const Planner = () => {
  const [date, setDate] = React.useState(new Date());
  const [tasks, setTasks] = React.useState(initialTasks);
  const { toast } = useToast();

  const showToast = (message = "") => {
    toast({
      title: "🚧 Feature not implemented",
      description: message,
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    const newTaskText = e.target.elements.task.value;
    if (newTaskText) {
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          text: newTaskText,
          completed: false,
          dueDate: "Soon",
        },
      ]);
      e.target.reset();
    }
    showToast("Task added to local state for now!");
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
    showToast("Task removed from local state.");
  };

  return (
    <>
      <Helmet>
        <title>Planner | LearnAI</title>
        <meta name="description" content="Manage your tasks and schedule." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Planner</h1>
            <p className="text-muted-foreground">
              Organize your study schedule and stay on top of your tasks.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddTask}>
                <DialogHeader>
                  <DialogTitle>Add a new task</DialogTitle>
                  <DialogDescription>
                    What do you need to get done?
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    id="task"
                    name="task"
                    placeholder="e.g. Read chapter 7 of Neuroscience"
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

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Task List</CardTitle>
                <CardDescription>
                  You have {tasks.filter((t) => !t.completed).length} pending
                  tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <div>
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`font-medium cursor-pointer ${
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.text}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {task.dueDate}
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="glassmorphic-card">
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Calendar Sync</CardTitle>
                <CardDescription>
                  Connect your external calendars.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="google-calendar">Google Calendar</Label>
                  <Switch
                    id="google-calendar"
                    onCheckedChange={() => showToast()}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="outlook-calendar">Microsoft Outlook</Label>
                  <Switch
                    id="outlook-calendar"
                    onCheckedChange={() => showToast()}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Planner;
