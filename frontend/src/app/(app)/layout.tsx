"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [{href:"/",label:"Command Center",icon:"⚡"},{href:"/dashboard",label:"Dashboard",icon:"📊"},{href:"/tasks",label:"Tasks",icon:"📋"},{href:"/memory",label:"Memory",icon:"🧠"},{href:"/vault",label:"Vault",icon:"📚"},{href:"/automations",label:"Automations",icon:"🔄"},{href:"/integrations",label:"Integrations",icon:"🔌"},{href:"/settings",label:"Settings",icon:"⚙️"}];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, tokens, logout } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => { if (!tokens?.access_token) router.push("/login"); }, [tokens, router]);
  if (!tokens?.access_token) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 h-full bg-card border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border"><h1 className="text-lg font-bold">Tahmeed AI OS</h1><p className="text-xs text-muted-foreground">One Command. Your Entire AI Team.</p></div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map(item => (<Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${pathname === item.href ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}><span>{item.icon}</span><span>{item.label}</span></Link>))}
        </nav>
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0) || "U"}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div>
            <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground" title="Sign out">↗</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="h-full">{children}</div></main>
    </div>
  );
}
