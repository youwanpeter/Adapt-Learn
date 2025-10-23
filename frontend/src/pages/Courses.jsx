import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Book, BrainCircuit, Palette } from "lucide-react";

const coursesData = [
  {
    id: 1,
    title: "Introduction to Neural Networks",
    category: "AI/ML",
    progress: 65,
    status: "in-progress",
    icon: <BrainCircuit className="w-8 h-8 text-blue-400" />,
  },
  {
    id: 2,
    title: "Advanced CSS & Design Systems",
    category: "Web Development",
    progress: 90,
    status: "in-progress",
    icon: <Palette className="w-8 h-8 text-pink-400" />,
  },
  {
    id: 3,
    title: "History of Ancient Civilizations",
    category: "History",
    progress: 100,
    status: "completed",
    icon: <Book className="w-8 h-8 text-yellow-400" />,
  },
  {
    id: 4,
    title: "Data Structures in Python",
    category: "Web Development",
    progress: 25,
    status: "in-progress",
    icon: <BrainCircuit className="w-8 h-8 text-green-400" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const Courses = () => {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const showToast = () => {
    toast({
      title: "🚧 Feature not implemented",
    });
  };

  const filteredCourses = coursesData.filter((course) => {
    const statusMatch = filter === "all" || course.status === filter;
    const searchMatch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <>
      <Helmet>
        <title>Courses | LearnAI</title>
        <meta name="description" content="Browse and manage your courses." />
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
            <h1 className="text-3xl font-bold text-white">Your Courses</h1>
            <p className="text-muted-foreground">
              Continue your learning journey.
            </p>
          </div>
          <Button
            onClick={showToast}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Course
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="all" onValueChange={setFilter}>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  className="pl-10 bg-white/5 border-white/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <TabsContent value={filter} className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <motion.div key={course.id} variants={itemVariants}>
                    <Card className="glassmorphic-card h-full flex flex-col">
                      <CardHeader className="flex-row items-start gap-4">
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          {course.icon}
                        </div>
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription>{course.category}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-sm font-bold">
                            {course.progress}%
                          </span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" onClick={showToast}>
                          {course.progress === 100
                            ? "Review Course"
                            : "Continue Learning"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {filteredCourses.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    No courses found. Try a different filter or search term.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Courses;
