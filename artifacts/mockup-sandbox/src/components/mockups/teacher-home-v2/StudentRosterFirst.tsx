import React from "react";
import { 
  Bell, 
  Search, 
  Map, 
  Gift, 
  Compass, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Star,
  Play
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const STUDENTS = [
  { id: 1, name: "Carlos M.", initials: "CM", color: "bg-blue-100 text-blue-700", status: "active", statusText: "On Adventure" },
  { id: 2, name: "Mia R.", initials: "MR", color: "bg-purple-100 text-purple-700", status: "idle", statusText: "Idle" },
  { id: 3, name: "James T.", initials: "JT", color: "bg-green-100 text-green-700", status: "done", statusText: "Done for today" },
  { id: 4, name: "Sophie L.", initials: "SL", color: "bg-orange-100 text-orange-700", status: "active", statusText: "On Adventure" },
  { id: 5, name: "Noah K.", initials: "NK", color: "bg-pink-100 text-pink-700", status: "pending", statusText: "Needs review" },
];

const ACTIVITIES = [
  { id: 1, studentId: 1, studentName: "Carlos M.", action: "started an Adventure", detail: "Morning Routine", time: "10m ago", icon: Play, iconColor: "text-blue-500", bg: "bg-blue-50" },
  { id: 2, studentId: 3, studentName: "James T.", action: "completed", detail: "Math Basics", time: "45m ago", icon: CheckCircle2, iconColor: "text-green-500", bg: "bg-green-50" },
  { id: 3, studentId: 5, studentName: "Noah K.", action: "needs help with", detail: "Reading Quiz", time: "1h ago", icon: AlertCircle, iconColor: "text-orange-500", bg: "bg-orange-50" },
  { id: 4, studentId: 2, studentName: "Mia R.", action: "earned a reward", detail: "Gold Star", time: "2h ago", icon: Star, iconColor: "text-yellow-500", bg: "bg-yellow-50" },
];

export default function StudentRosterFirst() {
  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-gray-50 overflow-hidden font-sans pb-16 shadow-xl relative">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src="https://i.pravatar.cc/150?u=carlo" />
              <AvatarFallback className="bg-[#2F80ED] text-white">C</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-500 leading-none mb-1">Good morning,</p>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Teacher Carlo</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full relative text-gray-600 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        {/* Your Students Section */}
        <section className="py-5 bg-white border-b border-gray-100">
          <div className="px-5 flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Students</h2>
            <Button variant="ghost" className="text-[#2F80ED] text-sm h-8 px-2 font-medium">View All</Button>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap px-5 pb-4">
            <div className="flex w-max space-x-4">
              {STUDENTS.map((student) => (
                <div key={student.id} className="flex flex-col items-center group cursor-pointer">
                  <div className="relative mb-2">
                    <Avatar className={`h-16 w-16 border-2 border-white shadow-sm transition-transform group-hover:scale-105 ${student.color}`}>
                      <AvatarFallback className="text-lg font-semibold">{student.initials}</AvatarFallback>
                    </Avatar>
                    
                    {/* Status Badge */}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center bg-white shadow-sm">
                      {student.status === "active" && <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />}
                      {student.status === "idle" && <span className="h-3 w-3 rounded-full bg-yellow-400" />}
                      {student.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {student.status === "pending" && <span className="h-3 w-3 rounded-full bg-orange-500" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{student.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{student.statusText}</span>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </section>

        {/* Quick Access Row */}
        <section className="px-5 py-6">
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-xl border-gray-200 bg-white hover:bg-blue-50 hover:text-[#2F80ED] hover:border-blue-200 shadow-sm transition-all">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-[#2F80ED]">
                <Map className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Adventures</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-xl border-gray-200 bg-white hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 shadow-sm transition-all">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Gift className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Rewards</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-xl border-gray-200 bg-white hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 shadow-sm transition-all">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Voyage</span>
            </Button>
          </div>
        </section>

        {/* Activity Feed */}
        <section className="px-5 pb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Feed</h2>
          <div className="space-y-3">
            {ACTIVITIES.map((activity) => (
              <Card key={activity.id} className="border-0 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex items-stretch">
                  <div className={`w-2 ${activity.bg}`} />
                  <div className="p-4 flex-1 flex items-start gap-3 bg-white">
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${activity.bg} ${activity.iconColor}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        <span className="font-bold text-gray-900">{activity.studentName}</span> {activity.action} <span className="font-semibold">{activity.detail}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Updates / Tips */}
        <section className="px-5 pb-8">
          <Card className="bg-gradient-to-br from-[#2F80ED] to-blue-700 border-0 shadow-md text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
            <CardContent className="p-5 relative z-10 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Weekly Tip</span>
              </div>
              <h3 className="text-lg font-bold mb-1 leading-tight">Positive Reinforcement</h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                Students respond 30% better when rewards are given immediately after completing a difficult task.
              </p>
              <Button variant="secondary" className="self-start text-[#2F80ED] font-bold text-sm h-9 px-4 rounded-lg bg-white hover:bg-blue-50">
                Read Article
              </Button>
            </CardContent>
          </Card>
        </section>
      </ScrollArea>
    </div>
  );
}
