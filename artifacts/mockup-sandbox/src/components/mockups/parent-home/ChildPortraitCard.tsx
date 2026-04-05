import React from "react";
import { Clock } from "lucide-react";

export default function ChildPortraitCard() {
  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-sky-100 via-sky-50/50 to-white font-sans text-slate-800 pb-20 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-12 pb-6 relative z-10">
            <div>
                <p className="text-sm font-medium text-slate-500">Good morning</p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hi Carlo! 👋</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-sm border-2 border-white">
                C
            </div>
        </header>

        {/* Hero Card - Child Centric */}
        <div className="px-6 mb-8 relative z-10">
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-blue-900/5 border border-white">
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-purple-50 p-1 mb-4 shadow-sm">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-blue-600 shadow-inner">
                            👦🏽
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Carlo is active</h2>
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium border border-amber-100 mb-4">
                        <span className="text-lg">🍳</span>
                        On Breakfast Adventure
                    </div>
                    <p className="text-slate-500 text-sm px-4">
                        Doing great! Started 10 mins ago and moving steadily.
                    </p>
                </div>
            </div>
        </div>

        {/* Category Strip */}
        <div className="mb-10 relative z-10">
            <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 gap-4 pb-4 snap-x">
                {[
                    { icon: "🗺️", label: "Adventures", color: "bg-blue-50 text-blue-600 border-blue-100" },
                    { icon: "🎁", label: "Rewards", color: "bg-amber-50 text-amber-600 border-amber-100" },
                    { icon: "😊", label: "Mood", color: "bg-rose-50 text-rose-600 border-rose-100" },
                    { icon: "📚", label: "Learning", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                    { icon: "👥", label: "Community", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                    { icon: "📅", label: "Schedule", color: "bg-purple-50 text-purple-600 border-purple-100" },
                ].map((item, i) => (
                    <button key={i} className="flex flex-col items-center gap-2 snap-start group outline-none">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm border transition-transform group-active:scale-95 ${item.color}`}>
                            {item.icon}
                        </div>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Today's Schedule Timeline */}
        <div className="px-6 mb-10 relative z-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Today's Journey</h3>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">See all</button>
            </div>
            
            <div className="relative pl-4 space-y-6 before:absolute before:inset-y-2 before:left-[23px] before:w-[2px] before:bg-slate-200/60">
                {/* Active Item */}
                <div className="relative flex items-start gap-4">
                    <div className="absolute -left-4 mt-1 bg-white p-1 rounded-full border-2 border-amber-400 z-10">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ring-1 ring-amber-500/20">
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> NOW
                            </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-base mb-1">Breakfast Adventure 🍳</h4>
                        <p className="text-sm text-slate-500">Morning routine</p>
                    </div>
                </div>

                {/* Upcoming Item */}
                <div className="relative flex items-start gap-4 opacity-75">
                    <div className="absolute -left-4 mt-1 bg-white p-1 rounded-full border-2 border-slate-200 z-10">
                        <div className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                    </div>
                    <div className="flex-1 px-4 py-2">
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 1:00 PM
                            </span>
                        </div>
                        <h4 className="font-medium text-slate-800 text-base">Regular Class 📚</h4>
                    </div>
                </div>

                {/* Upcoming Item */}
                <div className="relative flex items-start gap-4 opacity-75">
                    <div className="absolute -left-4 mt-1 bg-white p-1 rounded-full border-2 border-slate-200 z-10">
                        <div className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                    </div>
                    <div className="flex-1 px-4 py-2">
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 6:00 PM
                            </span>
                        </div>
                        <h4 className="font-medium text-slate-800 text-base">Parent Training 👥</h4>
                    </div>
                </div>
            </div>
        </div>

        {/* Updates */}
        <div className="px-6 relative z-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Updates</h3>
            <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                        🌟
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 text-sm mb-1">Great focus today!</h4>
                        <p className="text-sm text-slate-600 leading-snug">Carlo showed excellent attention during the counting exercise. Really proud of his progress.</p>
                        <span className="text-xs text-slate-400 mt-2 block">Teacher Sarah • 2h ago</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
