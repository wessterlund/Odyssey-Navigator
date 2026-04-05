import React from 'react';
import { Clock, Map, Star, Award, CheckCircle2, ChevronRight, Bell, Circle, Calendar, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AgendaMode() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative overflow-hidden shadow-xl border-x border-slate-200">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Thursday, Oct 24</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good morning, Carlo</h1>
          </div>
          <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
            <AvatarImage src="https://i.pravatar.cc/150?u=carlo" />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
        </div>

        {/* Pill Row */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          <div className="flex flex-col bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 min-w-[100px]">
            <span className="text-2xl font-bold text-blue-600">3</span>
            <span className="text-xs font-semibold text-blue-800">Active Now</span>
          </div>
          <div className="flex flex-col bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 min-w-[100px]">
            <span className="text-2xl font-bold text-emerald-600">2</span>
            <span className="text-xs font-semibold text-emerald-800">Completed</span>
          </div>
          <div className="flex flex-col bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 min-w-[100px]">
            <span className="text-2xl font-bold text-slate-600">1</span>
            <span className="text-xs font-semibold text-slate-700">Pending</span>
          </div>
        </div>
      </header>

      {/* Timeline section */}
      <main className="flex-1 px-6 py-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Today's Agenda
        </h2>

        <div className="relative pl-6 border-l-2 border-slate-100 space-y-10 pb-8">
          
          {/* Done item */}
          <div className="relative group cursor-pointer">
            <div className="absolute -left-[35px] top-1 rounded-full bg-emerald-100 p-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col space-y-2 opacity-60">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-500">9:00 AM</span>
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">Done</Badge>
              </div>
              <Card className="bg-slate-50/50 border-slate-200 shadow-none hover:bg-slate-100 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Map className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700 line-through decoration-slate-300">Morning Voyage Setup</h3>
                    <p className="text-xs text-slate-500">All 6 students assigned</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active item */}
          <div className="relative group cursor-pointer">
            <div className="absolute -left-[35px] top-1 rounded-full bg-blue-100 p-1 shadow-[0_0_0_4px_white]">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-blue-600">11:30 AM (Now)</span>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">In Progress</Badge>
              </div>
              <Card className="bg-white border-blue-200 shadow-md shadow-blue-100/50 ring-1 ring-blue-100 overflow-hidden transform transition-transform active:scale-[0.98]">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Math Adventures</h3>
                      <p className="text-sm text-slate-500 mb-3">Mia and James are currently playing "Space Numbers"</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                        <div className="flex -space-x-2">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarFallback className="bg-pink-100 text-pink-700 text-xs font-medium">M</AvatarFallback>
                          </Avatar>
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">J</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex items-center text-blue-600 text-sm font-semibold hover:text-blue-700">
                          Join Live <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming item */}
          <div className="relative group cursor-pointer">
            <div className="absolute -left-[35px] top-1 rounded-full bg-white p-1 border-2 border-slate-200 group-hover:border-slate-300 transition-colors">
              <div className="w-3 h-3 rounded-full bg-transparent" />
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-600">2:00 PM</span>
                <span className="text-xs font-medium text-slate-400">in 2.5 hrs</span>
              </div>
              <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Map className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Focus Time</h3>
                    <p className="text-xs text-slate-500">Carlos • Sensory Break</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming item 2 */}
          <div className="relative group cursor-pointer">
            <div className="absolute -left-[35px] top-1 rounded-full bg-white p-1 border-2 border-slate-200 group-hover:border-slate-300 transition-colors">
              <div className="w-3 h-3 rounded-full bg-transparent" />
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-600">3:30 PM</span>
              </div>
              <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Reward Distribution</h3>
                    <p className="text-xs text-slate-500">Weekly treasure chest</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        {/* Updates Feed */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Latest Updates
          </h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 leading-snug mb-1"><span className="font-semibold text-slate-900">Carlos</span> unlocked a new sticker in Math Voyage.</p>
                <span className="text-xs font-medium text-slate-400">10 mins ago</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 leading-snug mb-1"><span className="font-semibold text-slate-900">Mia</span> completed her morning routine 5 minutes early.</p>
                <span className="text-xs font-medium text-slate-400">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}