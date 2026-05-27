import { Link, Outlet } from "react-router-dom";
import { Flower2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function SuperAdminLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border bg-gradient-botanical text-primary-foreground flex items-center px-4 gap-3">
        <Link to="/super-admin" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <img src="/scalius-icon.png" alt="Scalius" className="h-5 w-5 object-contain invert brightness-200" /> Scalius Vitrine · Super Admin
        </Link>
        <div className="flex-1" />
        <span className="text-sm opacity-90">{user?.full_name}</span>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-white/10">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>
      <main className="flex-1 container py-8"><Outlet /></main>
    </div>
  );
}
