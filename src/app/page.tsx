"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Calendar, Clock, AlertCircle, Loader2 } from "lucide-react";

interface DatabaseStatus {
  tables: number;
  indexes: number;
  isMigrated: boolean;
  hasDefaultData: boolean;
}

interface TableStatus {
  table: string;
  exists: boolean;
}

export default function Home() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/status");
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();
        setStatus(data.status);
        setTables(data.tables);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Error Loading Status</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Daily Task Planner
          </h1>
          <p className="text-lg text-muted-foreground">
            A production-ready task planner with local-first SQLite storage
          </p>
        </div>

        {/* Database Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Database Stats */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Database Status
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tables:</span>
                <span className="font-medium">{status?.tables ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Indexes:</span>
                <span className="font-medium">{status?.indexes ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Migrated:</span>
                <Badge variant={status?.isMigrated ? "default" : "destructive"}>
                  {status?.isMigrated ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default Data:</span>
                <Badge variant={status?.hasDefaultData ? "default" : "destructive"}>
                  {status?.hasDefaultData ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tables List */}
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Database Tables
            </h2>
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.table}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-muted-foreground">
                    {table.table}
                  </span>
                  {table.exists ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UI Components Preview */}
        <div className="p-6 border rounded-lg bg-card mb-12">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            UI Components Preview
          </h2>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label htmlFor="terms" className="text-sm">
                  Checkbox component
                </label>
              </div>
              <Input placeholder="Input component" className="w-48" />
            </div>
          </div>
        </div>

        {/* Priority Colors */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-6">Priority Colors</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-priority-high" />
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-priority-medium" />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-priority-low" />
              <span className="text-sm">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-priority-none" />
              <span className="text-sm">None</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with Next.js 16, Tailwind CSS, and SQLite</p>
        </footer>
      </main>
    </div>
  );
}
