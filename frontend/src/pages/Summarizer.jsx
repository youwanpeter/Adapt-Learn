// src/pages/Summarizer.jsx
import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Wand2, Loader2, Clipboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { http } from "@/lib/api";

export default function Summarizer() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [text, setText] = React.useState("");
  const [maxSentences, setMaxSentences] = React.useState(5);
  const [summary, setSummary] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const handleSummarize = async () => {
    if (!text.trim()) {
      toast({
        title: "Add some text",
        description: "Paste the content you want to summarize.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary("");
    try {
      const { data } = await http.post(
        "/ai/summarize",
        { text, maxSentences: Number(maxSentences) || 5 },
        { headers: authHeader }
      );
      setSummary(data?.summary || "");
      if (!data?.summary) {
        toast({
          title: "No summary returned",
          description: "Try shortening the input or reducing sentence count.",
        });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate summary.";
      toast({
        title: "Summarization error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Summarizer | LearnAI</title>
        <meta
          name="description"
          content="Summarize your documents and texts with AI."
        />
      </Helmet>

      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">
            AI Text Summarizer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Paste your text or upload a document to get a concise, AI-generated
            summary.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Your Text</CardTitle>
              <CardDescription>
                Paste the content you want to summarize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your text here..."
                rows={15}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">
                  Max sentences
                </label>
                <Input
                  className="w-24"
                  type="number"
                  min={1}
                  max={12}
                  value={maxSentences}
                  onChange={(e) => setMaxSentences(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <Button onClick={handleSummarize} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Summarizing…
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" /> Summarize
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate("/upload")}>
                  <FileText className="mr-2 h-4 w-4" /> Upload File
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Output */}
          <Card className="glassmorphic-card">
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>Generated Summary</CardTitle>
                <CardDescription>
                  Your concise summary will appear here.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                disabled={!summary}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary/50 rounded-lg min-h-[300px] text-sm leading-relaxed whitespace-pre-wrap">
                {summary ? (
                  summary
                ) : loading ? (
                  <span className="text-muted-foreground">Thinking…</span>
                ) : (
                  <span className="text-muted-foreground">
                    The summary will be generated here...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
}
