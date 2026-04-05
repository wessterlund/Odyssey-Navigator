import React, { useState } from 'react';

const students = [
  { id: 1, name: 'Leo', status: 'On Voyage', progress: 75, x: 20, y: 30, direction: 'right' },
  { id: 2, name: 'Mia', status: 'On Voyage', progress: 40, x: 60, y: 45, direction: 'right' },
  { id: 3, name: 'Sam', status: 'Mission Complete', progress: 100, x: 80, y: 20, direction: 'left' },
  { id: 4, name: 'Zoe', status: 'On Voyage', progress: 15, x: 10, y: 70, direction: 'right' },
  { id: 5, name: 'Eli', status: 'In Port', progress: 0, x: 90, y: 80, direction: 'left' },
  { id: 6, name: 'Ava', status: 'On Voyage', progress: 60, x: 40, y: 60, direction: 'right' },
  { id: 7, name: 'Noah', status: 'In Port', progress: 0, x: 5, y: 15, direction: 'right' },
  { id: 8, name: 'Lily', status: 'On Voyage', progress: 90, x: 70, y: 65, direction: 'left' },
];

const logs = [
  { id: 1, time: '09:15', message: 'Leo reached Treasure Cove' },
  { id: 2, time: '08:45', message: 'Mia encountered a friendly dolphin' },
  { id: 3, time: '08:30', message: 'Sam completed the Morning Routine Voyage' },
  { id: 4, time: '08:00', message: 'Fleet deployed for the day' },
];

export default function OceanMetaphor() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="min-h-screen bg-[#0a1628] text-slate-200 font-sans selection:bg-amber-500/30 overflow-hidden relative">
      {/* Deep Ocean Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0f2847] to-[#114064] opacity-90" />
      
      {/* Subtle Animated Waves Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e40af 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto px-4 py-6 md:px-8">
        
        {/* Header - Captain's Bridge */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#1e40af]/50">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border-4 border-[#F59E0B] flex items-center justify-center bg-[#1e40af] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {/* Ship Wheel styling idea */}
              <div className="absolute inset-0 border-2 border-dashed border-[#F59E0B]/50 rounded-full animate-[spin_60s_linear_infinite]" />
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Carlo&backgroundColor=1e40af`} alt="Captain Carlo" className="w-12 h-12 rounded-full z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-amber-50 tracking-wide flex items-center gap-2">
                Captain Carlo <span className="text-2xl opacity-80">⚓</span>
              </h1>
              <p className="text-amber-400/80 text-sm tracking-widest uppercase mt-1 flex items-center gap-2">
                Fleet Commander <span className="w-1 h-1 bg-amber-400 rounded-full" /> 5 of 8 Ships on Voyage
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-6 text-sm font-medium tracking-wide uppercase text-slate-300">
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">🌤️</span>
              Fair Winds
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">🧭</span>
              Course Set
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* Main Map Area (2/3 width) */}
          <main className="lg:col-span-2 relative rounded-2xl border border-[#1e40af]/40 bg-[#0f2847]/40 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#0a1628]/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a1628]/80 to-transparent z-10 pointer-events-none" />
            
            <div className="p-4 border-b border-[#1e40af]/30 flex justify-between items-center bg-[#0a1628]/50 relative z-20">
              <h2 className="text-xl font-serif text-amber-100 flex items-center gap-2">
                <span>🗺️</span> Active Waters
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs tracking-wider uppercase">Active (5)</span>
                <span className="px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs tracking-wider uppercase">Idle (2)</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs tracking-wider uppercase">Done (1)</span>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#114064] to-[#0a1628]">
              {/* Compass Rose Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-96 h-96 animate-[spin_120s_linear_infinite]">
                  <polygon points="50,0 55,45 100,50 55,55 50,100 45,55 0,50 45,45" fill="currentColor" />
                </svg>
              </div>

              {/* Student Ships */}
              {students.map((student) => (
                <div 
                  key={student.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-700 hover:scale-110 hover:z-30"
                  style={{ left: `${student.x}%`, top: `${student.y}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a1628] border border-amber-500/30 rounded-lg p-3 shadow-xl w-48 z-40 pointer-events-none">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-amber-50">{student.name}</span>
                        <span className="text-xs text-amber-400">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-[#1e40af]/30 rounded-full h-1.5 mb-2">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${student.progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-300">{student.status}</p>
                    </div>

                    {/* Ship Icon */}
                    <div className={`text-3xl filter drop-shadow-lg ${student.direction === 'left' ? '-scale-x-100' : ''} ${student.status === 'On Voyage' ? 'animate-[bounce_3s_ease-in-out_infinite]' : ''}`}>
                      {student.status === 'Mission Complete' ? '🏝️' : '⛵'}
                    </div>
                    
                    {/* Name Label */}
                    <div className="mt-1 px-2 py-0.5 rounded bg-[#0a1628]/80 backdrop-blur-sm border border-[#1e40af]/50 text-xs font-medium text-slate-200">
                      {student.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Sidebar Area (1/3 width) */}
          <aside className="flex flex-col gap-6 min-h-0">
            
            {/* Navigation Destinations */}
            <div className="grid grid-cols-1 gap-3">
              <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#114064] to-[#0f2847] border border-[#1e40af]/50 p-4 text-left transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#0a1628] flex items-center justify-center text-2xl border border-[#1e40af] group-hover:scale-110 transition-transform">
                  🗺️
                </div>
                <div>
                  <h3 className="font-serif text-lg text-amber-50 group-hover:text-amber-400 transition-colors">Voyage Paths</h3>
                  <p className="text-xs text-slate-400">Chart learning courses</p>
                </div>
              </button>
              
              <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#114064] to-[#0f2847] border border-[#1e40af]/50 p-4 text-left transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#0a1628] flex items-center justify-center text-2xl border border-[#1e40af] group-hover:scale-110 transition-transform">
                  🔭
                </div>
                <div>
                  <h3 className="font-serif text-lg text-amber-50 group-hover:text-amber-400 transition-colors">Adventures</h3>
                  <p className="text-xs text-slate-400">Daily student missions</p>
                </div>
              </button>

              <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#114064] to-[#0f2847] border border-[#1e40af]/50 p-4 text-left transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#0a1628] flex items-center justify-center text-2xl border border-[#1e40af] group-hover:scale-110 transition-transform">
                  💎
                </div>
                <div>
                  <h3 className="font-serif text-lg text-amber-50 group-hover:text-amber-400 transition-colors">Treasures</h3>
                  <p className="text-xs text-slate-400">Manage rewards & loot</p>
                </div>
              </button>
            </div>

            {/* Ship's Log (Updates Feed) */}
            <div className="flex-1 rounded-2xl bg-[#e6dfc8] text-slate-800 p-1 relative overflow-hidden shadow-xl flex flex-col">
              {/* Aged paper texture effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', filter: 'contrast(150%) brightness(80%)' }} />
              
              <div className="relative z-10 flex-1 border-2 border-[#8b7355]/30 rounded-xl p-4 flex flex-col m-1">
                <h3 className="font-serif text-xl text-[#5c4a3d] border-b-2 border-[#5c4a3d]/20 pb-2 mb-4 flex items-center justify-between">
                  <span>Ship's Log</span>
                  <span className="text-sm font-sans text-[#8b7355]">Sep 24</span>
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-[#8b7355]/30 scrollbar-track-transparent">
                  {logs.map((log) => (
                    <div key={log.id} className="group relative pl-4 border-l-2 border-[#8b7355]/20">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#8b7355]/50 group-hover:bg-[#5c4a3d] transition-colors" />
                      <div className="text-xs font-medium text-[#8b7355] mb-0.5 font-mono">{log.time}</div>
                      <div className="text-sm text-[#3e3229] leading-tight">{log.message}</div>
                    </div>
                  ))}
                  
                  <div className="pt-4 text-center">
                    <button className="text-xs font-medium uppercase tracking-wider text-[#8b7355] hover:text-[#5c4a3d] transition-colors pb-1 border-b border-transparent hover:border-[#5c4a3d]/30">
                      View Older Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
