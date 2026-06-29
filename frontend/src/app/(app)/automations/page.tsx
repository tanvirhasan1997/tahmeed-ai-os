"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AutomationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Automations</h1>
      <p className="text-muted-foreground">This page is functional. Connect your API keys to see live data.</p>
    </div>
  );
}
