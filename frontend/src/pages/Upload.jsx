import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { http } from "@/lib/api";

/* ---------- Helpers ---------- */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024,
    dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const STRONG_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const EXTRA_TYPES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
];
const MAX_SIZE = 25 * 1024 * 1024;

const Upload = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const next = acceptedFiles.map((f) => ({
        file: f,
        progress: 0,
        status: "ready",
        result: null,
        error: null,
      }));

      next.forEach((item) => {
        if (item.file.size > MAX_SIZE) {
          item.status = "error";
          item.error = `File too large (>${formatBytes(MAX_SIZE)})`;
        } else if (
          !STRONG_TYPES.includes(item.file.type) &&
          !EXTRA_TYPES.includes(item.file.type)
        ) {
          item.status = "error";
          item.error = "Unsupported file type";
        }
      });

      setFiles((prev) => [...prev, ...next]);

      if (next.some((i) => EXTRA_TYPES.includes(i.file.type))) {
        toast({
          title: "Heads up ⚠️",
          description:
            "PPTX/images will upload, but only PDF/DOCX are fully processed.",
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: MAX_SIZE,
  });

  const removeFile = (idx) =>
    setFiles((arr) => arr.filter((_, i) => i !== idx));
  const clearAll = () => setFiles([]);

  const uploadOne = async (idx) => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Not signed in",
        description: "Please log in first to upload documents.",
        variant: "destructive",
      });
      return;
    }

    setFiles((arr) => {
      const clone = [...arr];
      clone[idx].status = "uploading";
      clone[idx].progress = 0;
      clone[idx].error = null;
      return clone;
    });

    const form = new FormData();
    form.append("file", files[idx].file);

    try {
      const res = await http.post("/documents/upload", form, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded * 100) / e.total);
          setFiles((arr) => {
            const clone = [...arr];
            if (clone[idx]) clone[idx].progress = pct;
            return clone;
          });
        },
        timeout: 60000,
      });

      setFiles((arr) => {
        const clone = [...arr];
        if (clone[idx]) {
          clone[idx].status = "done";
          clone[idx].result = res.data;
          clone[idx].progress = 100;
        }
        return clone;
      });

      const { document, topicsCount } = res.data || {};
      toast({
        title: "Uploaded ✅",
        description: `Saved "${files[idx].file.name}" • Topics: ${
          topicsCount ?? 0
        }`,
      });

      if (document?._id) {
        localStorage.setItem("lastUploadedDocId", document._id);
        window.dispatchEvent(
          new CustomEvent("last-uploaded-doc", {
            detail: { docId: document._id },
          })
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Check the server.";
      setFiles((arr) => {
        const clone = [...arr];
        if (clone[idx]) {
          clone[idx].status = "error";
          clone[idx].error = msg;
        }
        return clone;
      });
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleProcessFiles = async () => {
    const ready = files
      .map((f, i) => ({ ...f, idx: i }))
      .filter((f) => f.status === "ready");
    if (!ready.length) {
      toast({
        title: "Nothing to upload",
        description: "Add files or remove ones that errored.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    for (const item of ready) {
      if (!files[item.idx]) break;
      if (item.error) continue;
      await uploadOne(item.idx);
    }
    setIsUploading(false);
  };

  return (
    <>
      <Helmet>
        <title>Upload Documents | LearnAI</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">
            Upload Your Materials
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Drag and drop your documents here. We support PDF, DOCX, PPTX, and
            images.
          </p>
        </div>

        <Card className="glassmorphic-card max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-300 ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-white/20 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex justify-center mb-4"
              >
                <UploadCloud className="w-16 h-16 text-primary" />
              </motion.div>
              <p className="font-semibold">
                {isDragActive
                  ? "Drop the files here ..."
                  : "Drag 'n' drop some files here, or click to select files"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, DOCX, PPTX, JPG, PNG (25MB max each)
              </p>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card className="glassmorphic-card max-w-3xl mx-auto">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>Review and upload.</CardDescription>
              </div>
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleProcessFiles}
                  disabled={isUploading}
                >
                  {isUploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${
                        files.filter((f) => f.status === "ready").length
                      } file(s)`}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {files.map((item, index) => {
                  const { file, status, progress, error, result } = item;
                  const ok = status === "done",
                    bad = status === "error";
                  return (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon className="w-5 h-5 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-medium truncate text-sm">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.size)} •{" "}
                              {file.type || "unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {status === "uploading" && (
                            <span className="text-xs">{progress}%</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            disabled={status === "uploading"}
                            title="Remove"
                          >
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {status === "uploading" && (
                        <div className="w-full h-2 bg-black/20 rounded mt-2 overflow-hidden">
                          <div
                            className="h-2 bg-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      {bad && (
                        <p className="text-xs text-destructive mt-2">{error}</p>
                      )}
                      {ok && result && (
                        <p className="text-xs text-green-500 mt-2">
                          Saved • Doc ID: {result?.document?._id || "—"} •
                          Topics: {result?.topicsCount ?? 0}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </>
  );
};

export default Upload;
