import React from "react";
import { 
  Bell, 
  Map, 
  Gift, 
  Compass, 
  TrendingUp, 
  Activity,
  Clock,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Mock Data ---

const METRICS = {
  activeStudents: { current: 5, total: 8, percentage: 62 },
  completedToday: { count: 3, trend: "+1 from yesterday" },
  rewardsReady: { count: 2, status: "needs_attention" },
  avgCompletion: { percentage: 88 }
};

const RECENT_ACTIVITY = [
  {
    id: 1,
    student: "Leo M.",
    action: "Completed 'Morning Routine'",
    time: "10 mins ago",
    type: "success"
  },
  {
    id: 2,
    student: "Emma S.",
    action: "Earned 50 coins",
    time: "25 mins ago",
    type: "reward"
  },
  {
    id: 3,
    student: "Noah K.",
    action: "Started 'Grocery Store' Voyage",
    time: "1 hour ago",
    type: "voyage"
  },
  {
    id: 4,
    student: "Mia T.",
    action: "Requested a break",
    time: "2 hours ago",
    type: "attention"
  }
];

const UPDATES = [
  {
    id: 1,
    title: "New Visual Schedules Available",
    category: "Content",
    date: "Today"
  },
  {
    id: 2,
    title: "Best practices for token economies",
    category: "Tips",
    date: "Yesterday"
  }
];

export default function InsightsDashboard() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 w-full max-w-md mx-auto relative shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-slate-200">
            <AvatarImage src="/__mockup/images/teacher-hero.png" alt="Carlo" />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">C</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Morning, Carlo</h1>
            <p className="text-sm text-slate-500 font-medium">Class Health: Good</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative text-slate-600 rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8 pb-24">
          
          {/* Metrics Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Live Snapshot</h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Active Students */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Now</div>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{METRICS.activeStudents.current}</span>
                    <span className="text-sm font-medium text-slate-400">/ {METRICS.activeStudents.total}</span>
                  </div>
                  <Progress value={METRICS.activeStudents.percentage} className="h-1.5 bg-slate-100" />
                </CardContent>
              </Card>

              {/* Completed Today */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</div>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{METRICS.completedToday.count}</span>
                  </div>
                  <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    {METRICS.completedToday.trend}
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Ready */}
              <Card className="shadow-sm border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Rewards Ready</div>
                    <Gift className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-amber-900">{METRICS.rewardsReady.count}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-100 px-1.5 w-fit">
                    Action Needed
                  </Badge>
                </CardContent>
              </Card>

              {/* Avg Completion */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Step %</div>
                    <Activity className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{METRICS.avgCompletion.percentage}%</span>
                  </div>
                  <Progress value={METRICS.avgCompletion.percentage} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-500" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Quick Navigation */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Modules</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x hide-scrollbar">
              <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 snap-start min-w-[100px]">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
                  <Map className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Adventures</span>
              </Button>
              
              <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 snap-start min-w-[100px]">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1">
                  <Gift className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Rewards</span>
              </Button>
              
              <Button variant="outline" className="h-auto py-3 px-4 flex flex-col gap-2 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 snap-start min-w-[100px]">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-1">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Voyage</span>
              </Button>
            </div>
          </section>

          {/* Recent Activity Feed */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Recent Activity</h2>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-auto p-0 hover:bg-transparent hover:text-blue-700">View All</Button>
            </div>
            
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="p-4 flex gap-4 items-start bg-white hover:bg-slate-50 transition-colors">
                    <div className="mt-1">
                      {activity.type === 'success' && <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />}
                      {activity.type === 'reward' && <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />}
                      {activity.type === 'voyage' && <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />}
                      {activity.type === 'attention' && <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 font-medium">
                        <span className="font-bold">{activity.student}</span>
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{activity.action}</p>
                      <div className="flex items-center mt-2 gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Knowledge / Updates */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Updates & Tips</h2>
            <div className="flex flex-col gap-3">
              {UPDATES.map(update => (
                <div key={update.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100">
                        {update.category}
                      </Badge>
                      <span className="text-xs text-slate-400">{update.date}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{update.title}</h3>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              ))}
            </div>
          </section>

        </div>
      </ScrollArea>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
