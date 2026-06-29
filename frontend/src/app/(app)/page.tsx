"use client";
import { useState, useRef, useEffect } from "react";
import { useCommandStore, useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const AGENT_COLORS: Record<string, string> = {coding:"text-blue-400",research:"text-purple-400",marketing:"text-pink-400",content:"text-green-400",accounting:"text-yellow-400",security:"text-red-400",data:"text-cyan-400",support:"text-orange-400",hr:"text-indigo-400"};

export default function CommandCenter() {
  const [input, setInput] = useState("");
  const { messages, isLoading, addMessage, setLoading } = useCommandStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { api.getWorkspaces().then(d => { if (d.workspaces?.[0]) setWorkspaceId(d.workspaces[0].id); }).catch(() => {}); }, []);

  const send = async () => {
    if (!input.trim() || isLoading || !workspaceId) return;
    const cmd = input.trim();
    setInput("");
    addMessage({ id: crypto.randomUUID(), role: "user", content: cmd, content_type: "text", created_at: new Date().toISOString() });
    setLoading(true);
    try {
      const res = await api.sendCommand(cmd, workspaceId);
      addMessage({ id: res.message_id, role: "assistant", content: res.content, content_type: res.content_type, agent_name: res.agent_name, created_at: res.created_at });
    } catch (err: any) {
      addMessage({ id: crypto.randomUUID(), role: "assistant", content: `Error: ${err.message}`, content_type: "error", created_at: new Date().toISOString() });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4"><h1 className="text-xl font-semibold">Command Center</h1><p className="text-sm text-muted-foreground">Type any command and let AI agents handle it.</p></div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><div className="text-center max-w-lg">
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-muted-foreground mb-6">Type a command below. Try:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["Fix the login bug in auth.py","Write a blog post about AI","Analyze this month's expenses","Create a Meta ad campaign","Check my code for security issues","Generate interview questions for React dev"].map(ex => (<div key={ex} className="bg-card border border-border rounded-lg p-3 text-left cursor-pointer hover:bg-secondary" onClick={() => setInput(ex)}>{ex}</div>))}
            </div>
          </div></div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : msg.content_type === "error" ? "bg-destructive/10 border border-destructive/30" : "bg-card border border-border"}`}>
              {msg.agent_name && <span className={`text-xs font-medium ${AGENT_COLORS[msg.agent_name] || "text-muted-foreground"}`}>{msg.agent_name} agent</span>}
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none mt-1"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              <p className={`text-xs mt-2 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><div className="animate-pulse flex gap-1"><span className="w-2 h-2 bg-primary rounded-full animate-bounce" /><span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" /><span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" /></div><span className="text-sm">Agent is working...</span></div>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a command... (Enter to send)" rows={2} className="flex-1 px-4 py-3 bg-input border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm" disabled={isLoading || !workspaceId} />
          <button onClick={send} disabled={!input.trim() || isLoading || !workspaceId} className="px-5 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">{isLoading ? "..." : "Send"}</button>
        </div>
      </div>
    </div>
  );
}
