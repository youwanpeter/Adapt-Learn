import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { Bell, Mail, MessageSquare, CheckCircle } from 'lucide-react';

const remindersData = [
    { id: 1, text: "Quiz for 'History of AI' is due tomorrow.", time: "in 18 hours", icon: <Bell className="w-5 h-5 text-yellow-400" /> },
    { id: 2, text: "Start 'Advanced CSS' project.", time: "in 2 days", icon: <Bell className="w-5 h-5 text-blue-400" /> },
    { id: 3, text: "Review notes for 'Neural Networks'.", time: "in 4 days", icon: <Bell className="w-5 h-5 text-green-400" /> },
];

const Reminders = () => {
    const { toast } = useToast();

    const showToast = () => {
        toast({
            title: "✅ Settings Saved",
            description: "Your notification preferences have been updated (locally).",
        });
    };

    return (
        <>
            <Helmet>
                <title>Reminders & Notifications | LearnAI</title>
                <meta name="description" content="Manage your reminders and notification settings." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white">Reminders & Notifications</h1>
                    <p className="text-muted-foreground">Stay on track with smart alerts.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Upcoming Reminders</CardTitle>
                                <CardDescription>Here's what's on your schedule.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {remindersData.map(reminder => (
                                    <div key={reminder.id} className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg">
                                        <div className="flex items-start gap-4">
                                            {reminder.icon}
                                            <div>
                                                <p className="font-medium">{reminder.text}</p>
                                                <p className="text-xs text-muted-foreground">{reminder.time}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => toast({title: "Reminder dismissed!"})}>
                                            <CheckCircle className="h-5 w-5 text-muted-foreground hover:text-primary"/>
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="glassmorphic-card">
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>Choose how you receive alerts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="push-notifications" className="flex items-center gap-3">
                                        <Bell className="w-5 h-5" />
                                        <span>Push Notifications</span>
                                    </Label>
                                    <Switch id="push-notifications" onCheckedChange={showToast} defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email-notifications" className="flex items-center gap-3">
                                        <Mail className="w-5 h-5" />
                                        <span>Email Notifications</span>
                                    </Label>
                                    <Switch id="email-notifications" onCheckedChange={showToast} defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="sms-notifications" className="flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5" />
                                        <span>SMS Alerts</span>
                                    </Label>
                                    <Switch id="sms-notifications" onCheckedChange={showToast} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Reminders;