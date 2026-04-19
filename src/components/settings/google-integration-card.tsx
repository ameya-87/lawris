"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Loader2, AlertTriangle, Link2 } from "lucide-react";

interface Status {
  connected: boolean;
  connected_at: string | null;
  configured: boolean;
}

export function GoogleIntegrationCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/integrations/google/status", { cache: "no-store" });
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch {
      setStatus({ connected: false, connected_at: null, configured: false });
    }
  }

  useEffect(() => {
    load();
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const s = p.get("google");
    if (s === "connected") {
      toast.success("Google Calendar connected");
      const url = new URL(window.location.href);
      url.searchParams.delete("google");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    } else if (s === "error") {
      toast.error(p.get("message") ?? "Google connection failed");
    } else if (s === "not_configured") {
      toast.error("Google OAuth keys are not configured on the server");
    }
  }, []);

  function connect() {
    window.location.href = "/api/integrations/google/connect?return_to=/settings";
  }

  async function disconnect() {
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("disconnect failed");
      toast.success("Disconnected from Google Calendar");
      await load();
    } catch {
      toast.error("Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
      <div className="p-6 pb-4 flex items-start gap-4">
        <div className="h-10 w-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-stone-900">
            Google Calendar
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Sync hearings and deadlines as events in your Google Calendar.
          </p>
        </div>
      </div>

      <div className="px-6 pb-6">
        {status === null ? (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection…
          </div>
        ) : !status.configured ? (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Server not configured</div>
              <div className="text-amber-700 mt-0.5">
                Set <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code> and{" "}
                <code className="font-mono text-xs">GOOGLE_OAUTH_REDIRECT_URI</code> in{" "}
                <code className="font-mono text-xs">.env.local</code>, then restart the dev server.
              </div>
            </div>
          </div>
        ) : status.connected ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Connected
                {status.connected_at && (
                  <span className="text-stone-500 ml-1">
                    ({new Date(status.connected_at).toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={disconnect}
              disabled={busy}
              className="text-sm text-stone-600 hover:text-red-700 border border-stone-300 hover:border-red-300 rounded-md px-3 py-1.5 transition disabled:opacity-50"
            >
              {busy ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-3 py-2 transition"
          >
            <Link2 className="h-4 w-4" />
            Connect Google Calendar
          </button>
        )}
      </div>
    </div>
  );
}
