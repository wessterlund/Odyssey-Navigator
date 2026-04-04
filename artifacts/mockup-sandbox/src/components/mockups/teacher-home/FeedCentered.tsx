import React, { useState } from "react";
import { Search, Bell, Menu, Map, Gift, Rocket, ChevronRight, BookOpen, Star, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FeedCentered() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="w-[390px] h-[844px] bg-slate-50 flex flex-col relative overflow-hidden font-sans border border-slate-200 rounded-[40px] shadow-2xl mx-auto my-8">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-blue-100">
            <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">C</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-slate-500 font-medium leading-none mb-1">Good day,</p>
            <p className="text-lg font-bold text-[#2F80ED] leading-none">Hi Carlo!</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          5 active
        </Badge>
      </div>

      <ScrollArea className="flex-1 pb-24">
        {/* Navigation Strip */}
        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
          <button className="flex flex-col items-center gap-1.5 group">
            <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl group-active:scale-95 transition-transform">
              🗺️
            </div>
            <span className="text-[10px] font-semibold text-slate-600">Adventures</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 group">
            <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-xl group-active:scale-95 transition-transform">
              🎁
            </div>
            <span className="text-[10px] font-semibold text-slate-600">Rewards</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 group">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl group-active:scale-95 transition-transform">
              🚀
            </div>
            <span className="text-[10px] font-semibold text-slate-600">Voyage Path</span>
          </button>
        </div>

        {/* Feed Section */}
        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Updates</h2>
            <div className="flex gap-2">
              {["All", "Courses", "Posts"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeFilter === filter
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Article */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer active:scale-[0.98] transition-transform">
            <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl opacity-50 transform rotate-12">🧩</div>
              <Badge className="w-fit bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-sm mb-2 text-[10px] uppercase tracking-wider font-bold">
                Strategy
              </Badge>
              <h3 className="text-xl font-bold text-white leading-tight">Floortime Therapy</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                Floortime is child-led. The parent guides the child in play as a way to teach specific skills.
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-3 w-3 text-blue-600" />
                  </div>
                  Odyssey Learning · All Level
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Compact List */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform">
              <div className="h-16 w-16 rounded-lg bg-emerald-50 flex flex-col items-center justify-center flex-shrink-0 text-2xl">
                🗺️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 border-emerald-200 bg-emerald-50 px-1.5 py-0 h-4">
                    Adventure
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-medium">Beginner</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 truncate">Visual Schedules</h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Visual schedules help children understand daily routines and reduce anxiety around transitions.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform">
              <div className="h-16 w-16 rounded-lg bg-orange-50 flex flex-col items-center justify-center flex-shrink-0 text-2xl">
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold text-orange-600 border-orange-200 bg-orange-50 px-1.5 py-0 h-4">
                    Rewards
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-medium">Intermediate</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 truncate">Token Economy Systems</h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  A token economy system reinforces positive behaviors by allowing children to earn tokens.
                </p>
              </div>
            </div>
          </div>
          
          <div className="h-12" /> {/* Bottom spacer for sticky button */}
        </div>
      </ScrollArea>

      {/* Sticky Floating CTA */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <Button className="w-full h-14 bg-[#2F80ED] hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 font-bold text-lg flex items-center justify-center gap-2">
          <span>Teacher's Hub</span>
          <div className="bg-white/20 rounded-full p-1">
            <ChevronRight className="h-5 w-5" />
          </div>
        </Button>
      </div>
    </div>
  );
}
