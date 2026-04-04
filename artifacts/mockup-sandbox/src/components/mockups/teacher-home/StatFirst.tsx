import React from "react";
import { Search, Bell, Map, Gift, Rocket, ArrowRight, BookOpen, Star, Sparkles } from "lucide-react";

export default function StatFirst() {
  return (
    <div className="w-[390px] h-[844px] bg-slate-50 overflow-y-auto overflow-x-hidden font-sans relative shadow-xl border border-slate-200">
      {/* Top Section - Pastel Blue Card */}
      <div className="bg-[#E8F2FF] px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-slate-500 text-sm font-medium">Good day,</p>
            <h1 className="text-[#2F80ED] text-2xl font-bold tracking-tight">Hi Carlo!</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2F80ED] text-xl font-bold border-2 border-white">
            C
          </div>
        </div>

        {/* Massive Stat */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative">
            <span className="text-[120px] font-black text-[#2F80ED] leading-none tracking-tighter">5</span>
            {/* Decorative element */}
            <div className="absolute top-4 -right-6 text-[#2F80ED]/30">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          <p className="text-slate-600 font-medium text-lg mt-2 mb-6">Students on adventures</p>
          
          <button className="bg-white text-[#2F80ED] px-8 py-3.5 rounded-full font-bold shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 active:scale-95">
            Teacher's Hub
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Categories / Quick Actions */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 mb-8 snap-x">
          <button className="snap-start flex items-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
            <div className="text-xl">🗺️</div>
            <span className="font-semibold text-slate-700">Adventures</span>
          </button>
          <button className="snap-start flex items-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
            <div className="text-xl">🎁</div>
            <span className="font-semibold text-slate-700">Rewards</span>
          </button>
          <button className="snap-start flex items-center gap-2.5 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
            <div className="text-xl">🚀</div>
            <span className="font-semibold text-slate-700">Voyage Path</span>
          </button>
        </div>

        {/* Updates Section */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-slate-800">Today's Updates</h2>
            <button className="text-[#2F80ED] text-sm font-medium">View all</button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
              All
            </button>
            <button className="bg-white text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-200 shadow-sm">
              Courses
            </button>
            <button className="bg-white text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-200 shadow-sm">
              Posts
            </button>
          </div>

          {/* Article List */}
          <div className="flex flex-col gap-4 pb-12">
            {/* Article 1 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start active:bg-slate-50 transition-colors">
              <div className="w-14 h-14 shrink-0 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">Strategy</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1 truncate">Floortime Therapy</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-2">
                  Floortime is child-led. The parent guides the child in play as a way to teach specific skills.
                </p>
                <div className="text-[10px] font-medium text-slate-400">
                  Odyssey Learning · All Level
                </div>
              </div>
            </div>

            {/* Article 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start active:bg-slate-50 transition-colors">
              <div className="w-14 h-14 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                🗓️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F80ED] bg-[#E8F2FF] px-2 py-0.5 rounded-md">Adventure</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1 truncate">Visual Schedules</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-2">
                  Visual schedules help children understand daily routines and reduce anxiety around transitions.
                </p>
                <div className="text-[10px] font-medium text-slate-400">
                  Odyssey Learning · Beginner
                </div>
              </div>
            </div>

            {/* Article 3 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start active:bg-slate-50 transition-colors">
              <div className="w-14 h-14 shrink-0 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                ⭐️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Rewards</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1 truncate">Token Economy Systems</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-2">
                  A token economy system reinforces positive behaviors by allowing children to earn tokens.
                </p>
                <div className="text-[10px] font-medium text-slate-400">
                  Odyssey Learning · Intermediate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
