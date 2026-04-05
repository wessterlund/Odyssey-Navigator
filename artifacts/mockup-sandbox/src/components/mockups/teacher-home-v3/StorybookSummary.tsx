import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Star, Map, Gift, Compass, BookOpen, Quote, Clock, Activity } from "lucide-react";

export default function StorybookSummary() {
  return (
    <div className="min-h-[100dvh] bg-[#FFF8F0] text-slate-800 font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-100px] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[10%] w-80 h-80 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10 pb-20">
        
        {/* Header / Narrative Block */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3 text-amber-600 font-medium tracking-wide uppercase text-sm">
            <BookOpen className="w-5 h-5" />
            <span>Chapter 14 • Today's Tale</span>
          </div>
          
          <div className="relative">
            {/* Sparkle animations */}
            <div className="absolute -top-6 -left-4 animate-pulse text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="absolute top-12 -right-8 animate-bounce text-sky-400" style={{ animationDelay: '150ms' }}>
              <Star className="w-5 h-5 fill-current" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
              <span className="text-amber-500">☀️</span> What a day, Carlo! 
            </h1>
            
            <div className="mt-8 bg-white/70 backdrop-blur-md border border-amber-100 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
              <Quote className="absolute top-6 left-6 w-12 h-12 text-amber-100/50" />
              
              <p className="text-xl md:text-2xl font-serif leading-relaxed text-slate-700 relative z-10">
                Your class went on <strong className="text-amber-600 font-bold">3 brave voyages</strong> today. 
                Carlos conquered the Ocean Deep 🏆, Mia earned her first golden coin 🪙, and little James took his very first step 🌟. 
                <br/><br/>
                Together, your <strong className="text-rose-500 font-bold">5 active explorers</strong> (out of 8) collected <strong className="text-amber-600 font-bold">127 coins</strong> and completed <strong className="text-sky-600 font-bold">8 learning milestones</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Continue the Adventure */}
        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 flex items-center gap-3">
            <Compass className="w-6 h-6 text-emerald-500" />
            Continue the Adventure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <button className="group relative overflow-hidden bg-gradient-to-br from-sky-400 to-sky-500 p-8 rounded-[2rem] text-white text-left shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Map className="w-24 h-24" />
              </div>
              <Map className="w-10 h-10 mb-6" />
              <h3 className="font-bold text-2xl mb-2 font-serif">Adventures</h3>
              <p className="text-sky-100 font-medium">Plan tomorrow's quests</p>
            </button>

            <button className="group relative overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 p-8 rounded-[2rem] text-white text-left shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Gift className="w-24 h-24" />
              </div>
              <Gift className="w-10 h-10 mb-6" />
              <h3 className="font-bold text-2xl mb-2 font-serif">Rewards</h3>
              <p className="text-amber-100 font-medium">Stock the treasure chest</p>
            </button>

            <button className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-500 p-8 rounded-[2rem] text-white text-left shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Compass className="w-24 h-24" />
              </div>
              <Compass className="w-10 h-10 mb-6" />
              <h3 className="font-bold text-2xl mb-2 font-serif">Voyage Path</h3>
              <p className="text-emerald-100 font-medium">Chart their progress</p>
            </button>
          </div>
        </section>

        {/* Two-Column Layout for Highlights & Updates */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Student Highlights */}
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-semibold text-slate-800 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              Heroes of the Day
            </h2>
            <div className="grid gap-4">
              <Card className="bg-white/80 border-sky-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-4 border-sky-100 ring-2 ring-white">
                    <AvatarFallback className="bg-sky-200 text-sky-700 text-xl font-bold font-serif">M</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 font-serif mb-1">Mia</h3>
                    <div className="bg-sky-50 text-sky-800 px-4 py-2.5 rounded-2xl text-sm font-medium relative border border-sky-100/50">
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-sky-50 border-l border-b border-sky-100/50 transform rotate-45" />
                      "Earned her first golden coin during the Math Quest!" 🪙
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 border-amber-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-4 border-amber-100 ring-2 ring-white">
                    <AvatarFallback className="bg-amber-200 text-amber-800 text-xl font-bold font-serif">J</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 font-serif mb-1">James</h3>
                    <div className="bg-amber-50 text-amber-800 px-4 py-2.5 rounded-2xl text-sm font-medium relative border border-amber-100/50">
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-amber-50 border-l border-b border-amber-100/50 transform rotate-45" />
                      "Took his very first step in the Reading Jungle!" 🌟
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-rose-400" />
              Recent Chronicles
            </h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] border border-slate-200/60 p-6 md:p-8 space-y-6">
              
              {/* Feed Item */}
              <div className="relative pl-6 border-l-2 border-slate-200 pb-2">
                <div className="absolute w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-white -left-[9px] top-1" />
                <p className="text-slate-800 font-medium leading-snug">Carlos completed <strong className="text-emerald-600">Ocean Deep</strong> adventure.</p>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <Clock className="w-3 h-3" /> 10 mins ago
                </div>
              </div>

              {/* Feed Item */}
              <div className="relative pl-6 border-l-2 border-slate-200 pb-2">
                <div className="absolute w-4 h-4 rounded-full bg-amber-400 ring-4 ring-white -left-[9px] top-1" />
                <p className="text-slate-800 font-medium leading-snug">Mia unlocked <strong className="text-amber-600">Golden Coin</strong> reward.</p>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <Clock className="w-3 h-3" /> 45 mins ago
                </div>
              </div>

              {/* Feed Item */}
              <div className="relative pl-6 border-l-2 border-transparent pb-2">
                <div className="absolute w-4 h-4 rounded-full bg-sky-400 ring-4 ring-white -left-[9px] top-1" />
                <p className="text-slate-800 font-medium leading-snug">New voyage path <strong className="text-sky-600">Reading Jungle</strong> assigned to James.</p>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <Clock className="w-3 h-3" /> 2 hours ago
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Tips Section */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-[2.5rem] p-8 md:p-10 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
            <div className="bg-white p-5 rounded-full shadow-sm flex-shrink-0 animate-pulse" style={{ animationDuration: '3s' }}>
              <Sparkles className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-2xl text-rose-900 mb-2">A guiding whisper...</h3>
              <p className="text-rose-800/90 text-lg leading-relaxed">
                When the journey feels long, remember that every small step is a giant leap in their story. 
                Try adding a new treasure to the Rewards chest tomorrow—Carlos has been eyeing that rare sticker!
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
