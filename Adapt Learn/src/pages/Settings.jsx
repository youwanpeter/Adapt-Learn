import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from '@/components/ui/alert-dialog';

const Settings = () => {
    const { toast } = useToast();

    const showToast = (title, description) => {
        toast({
            title: title || "🚧 Feature not implemented",
            description: description || "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    };

    return (
        <>
            <Helmet>
                <title>Settings | LearnAI</title>
                <meta name="description" content="Manage your account and preferences." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Make changes to your public information here.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" onClick={() => showToast()}>Change Avatar</Button>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" defaultValue="Alex Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="alex.doe@example.com" />
                                </div>
                                <Button onClick={() => showToast("✅ Profile Saved!", "Your profile information has been updated.")}>Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                                <CardDescription>Manage your account settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label>Password</Label>
                                    <Button variant="outline" className="mt-2 w-full sm:w-auto" onClick={() => showToast()}>Change Password</Button>
                                </div>
                                <div>
                                    <Label>Subscription</Label>
                                    <p className="text-sm text-muted-foreground">You are currently on the <span className="text-primary font-semibold">Free Plan</span>.</p>
                                    <Button variant="outline" className="mt-2 w-full sm:w-auto" onClick={() => showToast()}>Manage Subscription</Button>
                                </div>
                                <Card className="border-destructive/50">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Delete Account</CardTitle>
                                        <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">Delete My Account</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => showToast("Account Deletion Initiated", "A confirmation email has been sent.")}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Configure how you receive notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <Label htmlFor="reminders" className="font-medium">Study Reminders</Label>
                                    <Switch id="reminders" defaultChecked onCheckedChange={() => showToast()} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <Label htmlFor="progress-updates" className="font-medium">Progress Updates</Label>
                                    <Switch id="progress-updates" defaultChecked onCheckedChange={() => showToast()} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <Label htmlFor="recommendations" className="font-medium">New Recommendations</Label>
                                    <Switch id="recommendations" defaultChecked onCheckedChange={() => showToast()} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <Label htmlFor="newsletter" className="font-medium">Product Newsletter</Label>
                                    <Switch id="newsletter" onCheckedChange={() => showToast()} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize the look and feel of the application.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Theme</Label>
                                    <p className="text-sm text-muted-foreground">The application is currently in Dark Mode. Light mode is coming soon!</p>
                                </div>
                                <Button variant="outline" disabled>Toggle Light Mode</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </>
    );
};

export default Settings;