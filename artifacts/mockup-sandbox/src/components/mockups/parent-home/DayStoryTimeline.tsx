import React from "react";
import { 
  CheckCircle2, 
  Circle, 
  Map, 
  Gift, 
  Smile, 
  BookOpen, 
  Users, 
  Calendar,
  MessageSquare,
  Clock,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  emoji: string;
  status: "past" | "current" | "future";
  type: "activity" | "update";
  description?: string;
  teacherName?: string;
}

const events: TimelineEvent[] = [
  {
    id: "1",
    time: "7:00 AM",
    title: "Breakfast Adventure",
    emoji: "🥞",
    status: "past",
    type: "activity",
    description: "Completed with 3 stars!"
  },
  {
    id: "2",
    time: "9:00 AM",
    title: "Morning Circle",
    emoji: "🎵",
    status: "past",
    type: "activity"
  },
  {
    id: "3",
    time: "9:45 AM",
    title: "Teacher Update",
    emoji: "📋",
    status: "past",
    type: "update",
    teacherName: "Ms. Sarah",
    description: "Carlo did great during the morning circle! He participated in all the songs."
  },
  {
    id: "4",
    time: "10:30 AM",
    title: "Sensory Play",
    emoji: "🎨",
    status: "current",
    type: "activity",
    description: "Working on fine motor skills"
  },
  {
    id: "5",
    time: "12:00 PM",
    title: "Lunch & Rest",
    emoji: "🍱",
    status: "future",
    type: "activity"
  },
  {
    id: "6",
    time: "1:00 PM",
    title: "Regular Class",
    emoji: "🎒",
    status: "future",
    type: "activity"
  },
  {
    id: "7",
    time: "3:30 PM",
    title: "Speech Therapy",
    emoji: "🗣️",
    status: "future",
    type: "activity"
  },
  {
    id: "8",
    time: "6:00 PM",
    title: "Parent Training",
    emoji: "👨‍👩‍👦",
    status: "future",
    type: "activity"
  }
];

const categories = [
  { id: "adventures", label: "Adventures", icon: Map, color: "bg-blue-100 text-blue-600" },
  { id: "rewards", label: "Rewards", icon: Gift, color: "bg-amber-100 text-amber-600" },
  { id: "mood", label: "Mood Captain", icon: Smile, color: "bg-pink-100 text-pink-600" },
  { id: "learning", label: "Learning", icon: BookOpen, color: "bg-green-100 text-green-600" },
  { id: "community", label: "Community", icon: Users, color: "bg-purple-100 text-purple-600" },
  { id: "scheduler", label: "Scheduler", icon: Calendar, color: "bg-orange-100 text-orange-600" },
];

export default function DayStoryTimeline() {
  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#FAFAFA] text-slate-900 font-sans mx-auto max-w-md w-full relative pb-10">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Good morning!
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Here's Carlo's day 🌊
            </p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-purple-200 shadow-sm">
            <AvatarFallback className="bg-purple-600 text-white font-bold text-lg">C</AvatarFallback>
          </Avatar>
        </div>

        {/* Categories Horizontal Scroll */}
        <ScrollArea className="w-full whitespace-nowrap -mx-6 px-6">
          <div className="flex w-max space-x-3 pb-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className="flex flex-col items-center justify-center space-y-2 group transition-transform active:scale-95"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color} shadow-sm border border-white/50 group-hover:shadow-md transition-all`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{cat.label}</span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      <div className="px-6 py-6">
        {/* Right Now Card */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Right Now</h2>
          </div>
          <Card className="bg-[#2F80ED] text-white border-none shadow-lg shadow-blue-900/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="text-8xl">🎨</span>
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-2 text-blue-100 mb-2 font-medium">
                <Clock className="w-4 h-4" />
                <span>10:30 AM - 11:30 AM</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">Sensory Play</h3>
              <p className="text-blue-100 font-medium">Working on fine motor skills</p>
              <Button className="mt-4 bg-white text-blue-600 hover:bg-blue-50 border-none font-bold shadow-sm">
                Join Activity <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="relative pl-4">
          {/* Vertical Line */}
          <div className="absolute left-[23px] top-4 bottom-0 w-[2px] bg-slate-200 rounded-full" />
          
          <div className="space-y-8">
            {events.map((event, index) => {
              const isPast = event.status === "past";
              const isCurrent = event.status === "current";
              const isFuture = event.status === "future";
              
              return (
                <div key={event.id} className={`relative flex items-start gap-5 transition-opacity duration-300 ${isPast ? 'opacity-60' : 'opacity-100'}`}>
                  
                  {/* Timeline Node */}
                  <div className="relative z-10 mt-1 flex-shrink-0 bg-[#FAFAFA] py-1">
                    {isPast && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-[#FAFAFA]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {isCurrent && (
                      <div className="relative flex items-center justify-center w-5 h-5 ring-4 ring-[#FAFAFA]">
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#2F80ED] opacity-30 animate-ping" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#2F80ED] ring-2 ring-white" />
                      </div>
                    )}
                    {isFuture && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white ring-4 ring-[#FAFAFA]" />
                    )}
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-[#2F80ED]' : 'text-slate-500'}`}>
                        {event.time}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          Now
                        </span>
                      )}
                    </div>
                    
                    {event.type === "update" ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-orange-100 text-orange-700 text-[10px] font-bold">
                              {event.teacherName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-slate-700">{event.teacherName}</span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" /> Update
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${
                          isPast ? 'bg-slate-100 grayscale-[0.5]' : 
                          isCurrent ? 'bg-blue-100 shadow-sm' : 'bg-slate-100'
                        }`}>
                          {event.emoji}
                        </div>
                        <div>
                          <h3 className={`font-bold ${isPast ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'} text-base`}>
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 text-center pb-8">
          <Button variant="ghost" className="text-slate-400 text-xs font-medium">
            End of day
          </Button>
        </div>
      </div>
    </div>
  );
}
