import React from "react";
import {
  AlertCircle,
  MessageSquare,
  Map,
  Gift,
  Smile,
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function FamilyCommandCenter() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans pb-10">
      {/* Header */}
      <header className="px-5 py-5 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Parent Home</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Carlo's Hub</h1>
        </div>
        <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-gray-100">
          <AvatarFallback className="bg-purple-600 text-white font-bold text-lg">C</AvatarFallback>
        </Avatar>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-8 max-w-md mx-auto w-full">
        {/* Zone 1: ATTENTION REQUIRED */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Attention Required
          </h2>
          <div className="flex flex-col gap-3">
            <Card className="bg-[#FEF9C3] border-amber-300 shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full mt-0.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900 leading-tight">Carlo missed his 7am step</h3>
                  <p className="text-sm text-amber-700 mt-1 leading-snug">Breakfast Adventure was skipped. Check in?</p>
                </div>
                <Button size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 shadow-sm h-8 px-3 shrink-0">
                  Review
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full mt-0.5">
                  <MessageSquare className="w-4 h-4 text-[#2F80ED]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">Teacher message waiting</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-snug">Ms. Sarah sent an update on Mood Captain.</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 px-3 shrink-0 text-gray-700 border-gray-300 shadow-sm">
                  Read
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Zone 2: TODAY'S FLOW */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Today's Flow
          </h2>
          <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
            <div className="flex flex-col divide-y divide-gray-100">
              {/* Past */}
              <div className="p-4 flex items-center gap-4 opacity-50">
                <div className="w-14 text-xs font-bold text-gray-500 text-right">7:00 AM</div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0"></div>
                <div className="flex-1 text-sm font-medium text-gray-600 line-through">Breakfast Adventure</div>
                <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
              
              {/* Current */}
              <div className="p-4 flex items-center gap-4 bg-[#2F80ED]/5 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2F80ED]"></div>
                <div className="w-14 text-xs font-black text-[#2F80ED] text-right">1:00 PM</div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#2F80ED] ring-4 ring-[#2F80ED]/20 shrink-0"></div>
                <div className="flex-1 text-sm font-bold text-gray-900">Regular Class</div>
                <span className="text-[10px] font-bold text-[#2F80ED] bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Now</span>
              </div>
              
              {/* Upcoming */}
              <div className="p-4 flex items-center gap-4">
                <div className="w-14 text-xs font-bold text-gray-400 text-right">6:00 PM</div>
                <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 shrink-0"></div>
                <div className="flex-1 text-sm font-medium text-gray-700">Parent Training</div>
              </div>
            </div>
          </Card>
        </section>

        {/* Zone 3: QUICK ACCESS */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Map, label: "Adventures", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { icon: Gift, label: "Rewards", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { icon: Smile, label: "Mood Captain", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
              { icon: BookOpen, label: "Learning", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
              { icon: Users, label: "Community", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { icon: Calendar, label: "Scheduler", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
            ].map((item, i) => (
              <button 
                key={i}
                className={`flex items-center gap-3 p-3.5 bg-white border border-gray-200 hover:${item.border} rounded-xl shadow-sm transition-all text-left group active:scale-[0.98]`}
              >
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2.5} />
                </div>
                <span className="flex-1 text-sm font-bold text-gray-800">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
