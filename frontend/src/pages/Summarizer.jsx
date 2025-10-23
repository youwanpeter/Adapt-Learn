import React from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { FileText, Wand2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

const Summarizer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [summary, setSummary] = React.useState("");

  const showToast = () => {
    toast({
      title: "🚧 Feature not implemented",
    });
  };

  const handleSummarize = () => {
    setSummary(
      "In the realm of artificial intelligence, a paradigm shift occurred with the introduction of the transformer architecture, which excels at handling sequential data like natural language. Unlike recurrent neural networks (RNNs) that process data sequentially, transformers process entire sequences at once using a mechanism called self-attention. This allows them to weigh the importance of different words in a sentence, leading to significant improvements in tasks like machine translation and text summarization, and forming the foundation for models like GPT."
    );
    showToast("Generated a sample summary for demonstration!");
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
            Simply paste your text into the box below or upload a document to
            receive a concise, AI-generated summary. Perfect for understanding
            long articles and papers quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Your Text</CardTitle>
              <CardDescription>
                Paste the content you want to summarize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Paste your text here..." rows={15} />
              <div className="flex justify-between items-center">
                <Button onClick={handleSummarize}>
                  <Wand2 className="mr-2 h-4 w-4" /> Summarize
                </Button>
                <Button variant="outline" onClick={() => navigate("/upload")}>
                  <FileText className="mr-2 h-4 w-4" /> Upload File
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle>Generated Summary</CardTitle>
              <CardDescription>
                Your concise summary will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary/50 rounded-lg min-h-[300px] text-sm leading-relaxed">
                {summary ? (
                  summary
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
};

export default Summarizer;
