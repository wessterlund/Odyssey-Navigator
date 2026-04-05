import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Map, Award, Compass, MessageSquare, ChevronRight, Activity, Clock } from "lucide-react";

export default function SplitPanel() {
  const students = [
    { id: 1, name: "Leo", status: "active" },
    { id: 2, name: "Maya", status: "active" },
    { id: 3, name: "Sam", status: "idle" },
    { id: 4, name: "Zoe", status: "active" },
    { id: 5, name: "Eli", status: "active" },
    { id: 6, name: "Ava", status: "idle" },
    { id: 7, name: "Max", status: "active" },
    { id: 8, name: "Mia", status: "idle" },
  ];

  const activeCount = students.filter((s) => s.status === "active").length;
  const totalCount = students.length;
  const progressPercent = (activeCount / totalCount) * 100;

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden bg-[#FAFAF9] font-sans">
      {/* Top Panel - Student World */}
      <div className="flex-1 flex flex-col bg-[#F0F5FC] relative pb-6">
        {/* Compact Header */}
        <header className="flex items-center justify-between px-5 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarImage src="https://i.pravatar.cc/150?u=carlo" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">C</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-slate-500 font-medium leading-none mb-1">Good morning,</p>
              <h1 className="text-base font-bold text-slate-900 leading-none">Carlo</h1>
            </div>
          </div>
          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </header>

        {/* Class Context */}
        <div className="px-5 flex-1 flex flex-col justify-center pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Your Class</h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white/60 px-2 py-1 rounded-full">
              <Activity size={12} className="text-[#2F80ED]" />
              <span className="text-[#2F80ED] font-bold">{activeCount}</span> / {totalCount} Active
            </div>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="bg-white rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 shadow-sm border border-slate-100/50 relative"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-xs font-bold ${
                      student.status === "active" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"
                    }`}>
                      {student.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    student.status === "active" ? "bg-green-500" : "bg-slate-300"
                  }`}></span>
                </div>
                <span className="text-[10px] font-bold text-slate-700">{student.name}</span>
              </div>
            ))}
          </div>

          {/* Class Progress */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100/50">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold text-slate-600">Daily Voyage Progress</span>
              <span className="text-xs font-bold text-[#2F80ED]">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 h-0 flex items-center justify-center -my-3">
        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>Class</span>
          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
          <span className="text-slate-800">Workspace</span>
        </div>
      </div>

      {/* Bottom Panel - Teacher Workspace */}
      <div className="flex-1 bg-[#FAFAF9] flex flex-col pt-8 pb-6 overflow-y-auto">
        <div className="px-5 flex-1 flex flex-col space-y-6">
          
          {/* Action List */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3">Quick Actions</h2>
            
            <button className="w-full flex items-center p-3 bg-white rounded-xl shadow-sm border border-slate-200/60 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                <Map size={20} className="text-orange-500" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-slate-800">Adventures</h3>
                <p className="text-xs text-slate-500">Plan daily activities</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button className="w-full flex items-center p-3 bg-white rounded-xl shadow-sm border border-slate-200/60 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                <Award size={20} className="text-purple-500" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-slate-800">Rewards</h3>
                <p className="text-xs text-slate-500">Manage economy</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button className="w-full flex items-center p-3 bg-white rounded-xl shadow-sm border border-slate-200/60 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                <Compass size={20} className="text-[#2F80ED]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-slate-800">Voyage Paths</h3>
                <p className="text-xs text-slate-500">Review learning goals</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Updates */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3 flex items-center justify-between">
              Updates
              <span className="text-[10px] font-medium text-slate-500 font-normal">View all</span>
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare size={14} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 leading-snug"><span className="font-bold">Leo's mom</span> left a note about today's morning routine.</p>
                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> 10 mins ago
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 leading-snug"><span className="font-bold">Maya</span> unlocked the "First Steps" badge!</p>
                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> 1 hour ago
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom padding for implied nav */}
          <div className="h-10"></div>
        </div>
      </div>
    </div>
  );
}
