import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

/* --- API base resolver (adds /api exactly once) --- */
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

export default function DashboardTopics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState(null); // latest document
  const [topics, setTopics] = useState([]); // topics for the latest doc
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchLatestDoc = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1) get my documents (already sorted desc in controller; if not, sort here)
      const { data } = await http.get("/documents/mine", {
        headers: authHeader,
      });
      const latest = Array.isArray(data) && data.length ? data[0] : null;

      if (!latest) {
        setDoc(null);
        setTopics([]);
        setLoading(false);
        return;
      }

      // 2) fetch topics only for this doc
      const { data: topicData } = await http.get(
        `/topics/by-document/${latest._id}`,
        { headers: authHeader }
      );

      setDoc(latest);
      setTopics(Array.isArray(topicData) ? topicData : topicData?.topics || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load topics.";
      setError(msg);
      setDoc(null);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  // Initial load
  useEffect(() => {
    if (!token) {
      setError("You are not signed in.");
      setLoading(false);
      return;
    }
    fetchLatestDoc();
  }, [token, fetchLatestDoc]);

  // Live update when Upload page reports a new document
  useEffect(() => {
    const onNewDoc = (e) => {
      const newId =
        e?.detail?.docId || localStorage.getItem("lastUploadedDocId");
      if (!newId) return;

      // If we already show same doc, just refresh topics (in case they changed)
      if (doc?._id === newId) {
        fetchLatestDoc();
        return;
      }

      // Clear old topics immediately for UX, then fetch new
      setDoc({ _id: newId });
      setTopics([]);
      fetchLatestDoc();
    };

    window.addEventListener("last-uploaded-doc", onNewDoc);
    // also react to storage changes (other tabs)
    const onStorage = (ev) => {
      if (ev.key === "lastUploadedDocId") onNewDoc();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("last-uploaded-doc", onNewDoc);
      window.removeEventListener("storage", onStorage);
    };
  }, [doc?._id, fetchLatestDoc]);

  const handleRefresh = () => fetchLatestDoc();

  return (
    <Card className="glassmorphic-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Topics to Review</CardTitle>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!token && (
          <p className="text-sm text-muted-foreground">
            Sign in to view topics.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading && !error && (
          <p className="text-sm text-muted-foreground">
            Loading latest topics…
          </p>
        )}

        {!loading && !error && !doc && (
          <p className="text-sm text-muted-foreground">
            No documents yet. Upload a PDF/DOCX to generate topics.
          </p>
        )}

        {!loading && !error && doc && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Showing topics from:{" "}
              <span className="font-medium">{doc.originalName || doc._id}</span>
            </p>

            {topics?.length ? (
              <ul className="space-y-2">
                {topics.map((t) => (
                  <li
                    key={t._id || `${t.title}-${t.start}`}
                    className="p-3 rounded-md bg-secondary/50"
                  >
                    <div className="font-medium text-sm">
                      {t.title || t.name}
                    </div>
                    {t.summary ? (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-3">
                        {t.summary}
                      </div>
                    ) : null}
                    {/* “View topics” could navigate to a detail route if you have one */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No topics extracted for this document.
              </p>
            )}

            {/* Optional: a “View topics” button that routes to a detail page */}
            {/* <Button className="mt-4" onClick={() => navigate(`/document/${doc._id}/topics`)}>View topics</Button> */}
          </>
        )}
      </CardContent>
    </Card>
  );
}
