import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { http } from "@/lib/api"; // ✅ Use the shared API client

const api = {
  me: () => http.get("/users/me"),
  updateProfile: (payload) => http.patch("/users/me/profile", payload),
  updateNotifications: (payload) =>
    http.patch("/users/me/notifications", payload),
  changePassword: (payload) => http.patch("/users/me/password", payload),
  deleteMe: () => http.delete("/users/me"),
};

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  /* ---------- state ---------- */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState(null);

  // profile edits (controlled inputs)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // notification toggles
  const notif = useMemo(
    () => ({
      studyReminders: !!me?.notificationSettings?.studyReminders,
      progressUpdates: !!me?.notificationSettings?.progressUpdates,
      recommendations: !!me?.notificationSettings?.recommendations,
      newsletter: !!me?.notificationSettings?.newsletter,
    }),
    [me]
  );

  /* ---------- helpers ---------- */
  const showErr = (title, err, fallback = "Something went wrong") =>
    toast({
      title,
      description: err?.response?.data?.message || err?.message || fallback,
      variant: "destructive",
    });

  /* ---------- init load ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.me();
        if (!mounted) return;
        setMe(data);
        setName(data?.name || "");
        setEmail(data?.email || "");
        setAvatarUrl(data?.avatarUrl || "");
      } catch (err) {
        showErr("Failed to load profile", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- actions ---------- */
  const onSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.updateProfile({ name, avatarUrl });
      toast({ title: "✅ Profile saved" });

      setMe(data); // data is the updated user object

      // ✅ 1. Update Local Storage with new data (avatarUrl, name)
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // ✅ 2. Dispatch event so Header updates immediately
      window.dispatchEvent(new Event("user-updated"));
    } catch (err) {
      showErr("Profile save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const onToggleNotif = async (id, checked) => {
    setMe((m) => ({
      ...m,
      notificationSettings: {
        ...m?.notificationSettings,
        [id]:
          typeof checked === "boolean"
            ? checked
            : !m?.notificationSettings?.[id],
      },
    }));
    try {
      await api.updateNotifications({
        studyReminders:
          id === "studyReminders" ? checked : notif.studyReminders,
        progressUpdates:
          id === "progressUpdates" ? checked : notif.progressUpdates,
        recommendations:
          id === "recommendations" ? checked : notif.recommendations,
        newsletter: id === "newsletter" ? checked : notif.newsletter,
      });
      toast({ title: "Saved" });
    } catch (err) {
      showErr("Update failed", err);
      try {
        const { data } = await api.me();
        setMe(data);
      } catch {
        /* ignore */
      }
    }
  };

  const onChangePassword = async () => {
    const oldPassword = prompt("Enter current password:");
    if (!oldPassword) return;
    const newPassword = prompt("Enter new password (min 6 chars):");
    if (!newPassword) return;

    try {
      await api.changePassword({ oldPassword, newPassword });
      toast({ title: "Password updated" });
    } catch (err) {
      showErr("Password change failed", err);
    }
  };

  const onDeleteAccount = async () => {
    try {
      await api.deleteMe();
      localStorage.clear();
      toast({ title: "Account deleted" });
      navigate("/auth");
    } catch (err) {
      showErr("Delete failed", err);
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <Helmet>
        <title>Settings | LearnAI</title>
        <meta
          name="description"
          content="Manage your account and preferences."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Make changes to your public information here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={avatarUrl || "https://github.com/shadcn.png"}
                      alt="User avatar"
                    />
                    <AvatarFallback>
                      {(name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://..."
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a direct link to an image (jpg/png).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>

                <Button onClick={onSaveProfile} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACCOUNT */}
          <TabsContent value="account">
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Password</Label>
                  <Button
                    variant="outline"
                    className="mt-2 w-full sm:w-auto"
                    onClick={onChangePassword}
                    disabled={loading}
                  >
                    Change Password
                  </Button>
                </div>

                <div>
                  <Label>Subscription</Label>
                  <p className="text-sm text-muted-foreground">
                    You are currently on the{" "}
                    <span className="text-primary font-semibold">
                      Free Plan
                    </span>
                    .
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 w-full sm:w-auto"
                    onClick={() => toast({ title: "Coming soon ✨" })}
                  >
                    Manage Subscription
                  </Button>
                </div>

                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      Delete Account
                    </CardTitle>
                    <CardDescription>
                      Permanently delete your account and all data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete My Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and remove
                            your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={onDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <Label htmlFor="reminders" className="font-medium">
                    Study Reminders
                  </Label>
                  <Switch
                    id="reminders"
                    checked={notif.studyReminders}
                    disabled={loading}
                    onCheckedChange={(v) => onToggleNotif("studyReminders", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <Label htmlFor="progress-updates" className="font-medium">
                    Progress Updates
                  </Label>
                  <Switch
                    id="progress-updates"
                    checked={notif.progressUpdates}
                    disabled={loading}
                    onCheckedChange={(v) => onToggleNotif("progressUpdates", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <Label htmlFor="recommendations" className="font-medium">
                    New Recommendations
                  </Label>
                  <Switch
                    id="recommendations"
                    checked={notif.recommendations}
                    disabled={loading}
                    onCheckedChange={(v) => onToggleNotif("recommendations", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <Label htmlFor="newsletter" className="font-medium">
                    Product Newsletter
                  </Label>
                  <Switch
                    id="newsletter"
                    checked={notif.newsletter}
                    disabled={loading}
                    onCheckedChange={(v) => onToggleNotif("newsletter", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPEARANCE */}
          <TabsContent value="appearance">
            <Card className="glassmorphic-card">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    The application is currently in Dark Mode. Light mode is
                    coming soon!
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Toggle Light Mode
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default Settings;
