import { Chatbot } from "@/components/Chatbot";
import Link from "next/link";
import { LayoutDashboard, Flame } from "lucide-react";

export const metadata = {
  title: "AI Ranger Chat | Wildfire RAG Intelligence",
  description: "RAG-Powered AI Intelligence Agent for Wildfire Telemetry & Incidents",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Top Navbar */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/40">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Wildfire RAG Intelligence Console
            </h1>
            <p className="text-xs text-slate-400">
              Assam Forest Operational Command • Gemini AI + ChromaDB Retrieval
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4 text-orange-400" />
          Sensor Dashboard
        </Link>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto h-[calc(100vh-130px)]">
        <Chatbot />
      </div>
    </div>
  );
}
