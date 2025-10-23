import React from "react";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const sampleNotifications = [
  {
    id: 1,
    title: "New course available",
    description: "Check out the new AI course!",
  },
  {
    id: 2,
    title: "Assignment due",
    description: "Your assignment is due tomorrow.",
  },
  {
    id: 3,
    title: "Profile updated",
    description: "Your profile was updated successfully.",
  },
];

const Header = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const showToast = () => {
    toast({
      title: "🚧 Feature not implemented",
      description:
        "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleLogout = () => {
    // ✅ Clear token + user
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // ✅ Redirect to login/auth page
    navigate("/auth", { replace: true });
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-lg z-10">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search courses, documents..."
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>
      <div className="flex items-center gap-4 ml-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sampleNotifications.length === 0 ? (
              <div className="px-4 py-2 text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              sampleNotifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-0.5 cursor-default"
                >
                  <span className="font-medium">{notif.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {notif.description}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={showToast}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={showToast}>Billing</DropdownMenuItem>
            <DropdownMenuItem onClick={showToast}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
