import React from "react";
import { Search, Clock, Star, Map, Gift, Compass, ChevronRight, Activity, CheckCircle, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CommandPalette() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="flex-1 w-full max-w-md mx-auto bg-white shadow-xl sm:my-8 sm:rounded-2xl sm:border border-zinc-200 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6 pb-4">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-zinc-900">Good morning, Carlo</h1>
            <p className="text-sm text-zinc-500">Ready for today's sessions?</p>
          </div>
          <Avatar className="h-9 w-9 border border-zinc-200">
            <AvatarImage src="https://i.pravatar.cc/150?u=carlo" />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
        </header>

        {/* Search */}
        <div className="px-5 pb-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-12 py-3.5 bg-zinc-100 border-0 rounded-xl text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm sm:text-sm outline-none"
              placeholder="Search students, adventures..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-zinc-200 bg-white text-zinc-400 text-xs font-medium">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-7">
          {/* Stats Strip */}
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 bg-zinc-50 py-2 px-3 rounded-lg border border-zinc-100">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>5 active</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>2 done today</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>1 pending</span>
            </div>
          </div>

          {/* Recents */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">Recent</h2>
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
              <button className="w-full flex items-center justify-between px-3 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 group">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-900">Carlos - Morning Routine</p>
                    <p className="text-xs text-zinc-500">Adventure • 10m ago</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 group">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg group-hover:bg-amber-100 transition-colors">
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-900">Tooth Brushing</p>
                    <p className="text-xs text-zinc-500">Reward • 1h ago</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-3 hover:bg-zinc-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Map className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-900">Emma's Voyage</p>
                    <p className="text-xs text-zinc-500">Voyage Path • 2h ago</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Pinned Features */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">Pinned</h2>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-zinc-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-full group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-zinc-700">Adventures</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-zinc-200 rounded-xl hover:border-amber-300 hover:shadow-sm transition-all group">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-full group-hover:scale-110 transition-transform">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-zinc-700">Rewards</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-zinc-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all group">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-full group-hover:scale-110 transition-transform">
                  <Map className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-zinc-700">Voyage</span>
              </button>
            </div>
          </div>

          {/* Updates */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">Updates</h2>
            <div className="space-y-2">
              <div className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-xs text-zinc-700 leading-relaxed">
                  <span className="font-semibold text-zinc-900">System Update:</span> New sensory-friendly adventure templates are now available.
                </p>
              </div>
              <div className="flex gap-3 items-start bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Leo has a milestone review coming up tomorrow.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
