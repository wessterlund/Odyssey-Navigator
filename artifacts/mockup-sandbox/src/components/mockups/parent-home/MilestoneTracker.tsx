import React from "react";
import { Check, Circle, CircleDashed, ChevronRight, Clock, Map, Gift, Smile, BookOpen, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export default function MilestoneTracker() {
  const steps = [
    { id: 1, title: "Morning Routine", time: "7:00 AM", status: "completed" },
    { id: 2, title: "Breakfast Adventure", time: "7:30 AM", status: "completed" },
    { id: 3, title: "Reading Time", time: "9:00 AM", status: "completed" },
    { id: 4, title: "Sensory Play", time: "11:00 AM", status: "completed" },
    { id: 5, title: "Lunch", time: "12:30 PM", status: "current" },
    { id: 6, title: "Speech Therapy", time: "2:00 PM", status: "upcoming" },
  ];

  const growthAreas = [
    { id: "adventures", label: "Adventures", icon: Map, progress: 66, text: "2 completed this week", color: "bg-blue-500" },
    { id: "rewards", label: "Rewards", icon: Gift, progress: 80, text: "450 coins earned", color: "bg-amber-500" },
    { id: "mood", label: "Mood Captain", icon: Smile, progress: 100, text: "Logged 5 days", color: "bg-green-500" },
    { id: "learning", label: "Learning", icon: BookOpen, progress: 40, text: "In progress", color: "bg-purple-500" },
    { id: "community", label: "Community", icon: Users, progress: 10, text: "1 new post", color: "bg-pink-500" },
    { id: "scheduler", label: "Scheduler", icon: Calendar, progress: 50, text: "3 upcoming events", color: "bg-indigo-500" },
  ];

  const schedule = [
    { id: 1, title: "Regular Class", time: "1:00 PM" },
    { id: 2, title: "Parent Training", time: "6:00 PM" },
  ];

  const updates = [
    { id: 1, title: "Great job today!", text: "Carlo did exceptionally well during reading time.", time: "1h ago", emoji: "🌟" },
    { id: 2, title: "Schedule Change", text: "Speech therapy moved to 2:00 PM.", time: "3h ago", emoji: "📅" },
  ];

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 font-sans pb-10">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hi Carlo!</h1>
          <p className="text-sm text-slate-500">Parent Hub</p>
        </div>
        <Avatar className="h-10 w-10 border-2 border-blue-100">
          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">C</AvatarFallback>
        </Avatar>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          
          {/* Progress Ring Section */}
          <section className="flex flex-col items-center justify-center pt-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Background Ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-200"
                />
                {/* Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-blue-500 transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{Math.round(progressPercentage)}%</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Today</span>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <h2 className="text-lg font-semibold text-slate-800">{completedSteps} of {totalSteps} steps completed</h2>
              <p className="text-sm text-slate-500 mt-1">Carlo is making great progress today!</p>
            </div>
          </section>

          {/* Mini Step List */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Today's Journey</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
              {steps.map((step) => (
                <div key={step.id} className="relative flex items-center gap-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 z-10 bg-white">
                    {step.status === "completed" && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    {step.status === "current" && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-200 animate-pulse">
                        <Circle className="w-2 h-2 fill-current" />
                      </div>
                    )}
                    {step.status === "upcoming" && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-300 flex items-center justify-center bg-slate-50">
                        <CircleDashed className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 flex justify-between items-center ${step.status === 'upcoming' ? 'opacity-50' : ''}`}>
                    <span className={`font-medium ${step.status === 'completed' ? 'text-slate-800 line-through' : step.status === 'current' ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>{step.title}</span>
                    <span className="text-xs text-slate-500 font-medium">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Growth Areas */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider px-1">Growth Areas</h3>
            <div className="grid grid-cols-1 gap-3">
              {growthAreas.map((area) => (
                <div key={area.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${area.color}`}>
                    <area.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-slate-800">{area.label}</h4>
                      <span className="text-xs font-medium text-slate-500">{area.text}</span>
                    </div>
                    <Progress value={area.progress} className="h-1.5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule Summary */}
            <section className="bg-slate-800 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4 text-slate-300">
                <Clock className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Up Next</h3>
              </div>
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-none">{item.time}</Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Updates Summary */}
            <section className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-900 mb-4 uppercase tracking-wider">Teacher Updates</h3>
              <div className="space-y-3">
                {updates.map((update) => (
                  <div key={update.id} className="bg-white p-3 rounded-xl shadow-sm border border-amber-100/50">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{update.emoji}</span>
                        <span className="font-semibold text-slate-800 text-sm">{update.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{update.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 pl-7">{update.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
