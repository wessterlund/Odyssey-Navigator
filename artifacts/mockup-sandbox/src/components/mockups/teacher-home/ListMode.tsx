import React from "react";
import { 
  ChevronRight, 
  Map as MapIcon, 
  Gift, 
  Rocket, 
  Bell, 
  Home, 
  Users, 
  Settings,
  Search
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ListMode() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-100 p-4 font-sans">
      <div className="w-[390px] h-[844px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-neutral-800 flex flex-col">
        {/* Status Bar Area */}
        <div className="h-12 w-full bg-white flex justify-between items-center px-6 pt-2 z-10">
          <span className="text-sm font-semibold">9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <div className="w-6 h-3 rounded-sm bg-black border border-neutral-300"></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          <div className="px-6 py-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Good day,</p>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Hi <span className="text-[#2F80ED]">Carlo!</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-5 w-5 text-neutral-600" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>
                <Avatar className="h-10 w-10 border-2 border-[#2F80ED]">
                  <AvatarFallback className="bg-blue-50 text-[#2F80ED] font-bold">C</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Compact Hero Card */}
            <Card className="mb-6 bg-[#2F80ED] text-white border-none shadow-md overflow-hidden rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between h-[80px]">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 h-12 w-12 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl font-bold">5</span>
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-white/90">Students on</p>
                    <p className="font-semibold text-white/90">adventures</p>
                  </div>
                </div>
                <Button className="bg-white text-[#2F80ED] hover:bg-blue-50 font-semibold rounded-full px-5 h-10 shadow-sm">
                  Teacher's Hub
                </Button>
              </CardContent>
            </Card>

            {/* List Navigation Categories */}
            <div className="space-y-3 mb-8">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Quick Actions</h2>
              
              <button className="w-full flex items-center justify-between bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-4 rounded-2xl text-left group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 text-lg">Adventures</h3>
                    <p className="text-xs text-neutral-500">Manage student maps</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-[#2F80ED] group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-4 rounded-2xl text-left group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 text-lg">Rewards</h3>
                    <p className="text-xs text-neutral-500">Send tokens & gifts</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-[#2F80ED] group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-4 rounded-2xl text-left group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 text-lg">Voyage Path</h3>
                    <p className="text-xs text-neutral-500">Track learning journey</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-[#2F80ED] group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </button>
            </div>

            {/* Updates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900">Updates</h2>
                <Button variant="ghost" size="sm" className="text-[#2F80ED] text-sm h-8 px-2">
                  View All
                </Button>
              </div>

              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                <Badge className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-sm font-medium whitespace-nowrap cursor-pointer">
                  All
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer shadow-sm">
                  Courses
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer shadow-sm">
                  Posts
                </Badge>
              </div>

              {/* Feed Cards */}
              <div className="space-y-4 mt-2">
                {/* Article 1 */}
                <Card className="border border-neutral-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="bg-blue-50 text-[#2F80ED] text-xs font-semibold rounded-md border-none px-2 py-0.5">
                          Strategy
                        </Badge>
                      </div>
                      <h3 className="font-bold text-neutral-900 text-base mb-1.5 leading-tight">Floortime Therapy</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 leading-snug mb-3">
                        Floortime is child-led. The parent guides the child in play as a way to teach specific skills.
                      </p>
                      <div className="flex items-center text-xs text-neutral-400 font-medium">
                        <span>Odyssey Learning</span>
                        <span className="mx-1.5">•</span>
                        <span>All Level</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Article 2 */}
                <Card className="border border-neutral-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="bg-orange-50 text-orange-600 text-xs font-semibold rounded-md border-none px-2 py-0.5">
                          Adventure
                        </Badge>
                      </div>
                      <h3 className="font-bold text-neutral-900 text-base mb-1.5 leading-tight">Visual Schedules</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 leading-snug mb-3">
                        Visual schedules help children understand daily routines and reduce anxiety around transitions.
                      </p>
                      <div className="flex items-center text-xs text-neutral-400 font-medium">
                        <span>Odyssey Learning</span>
                        <span className="mx-1.5">•</span>
                        <span>Beginner</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Article 3 */}
                <Card className="border border-neutral-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-md border-none px-2 py-0.5">
                          Rewards
                        </Badge>
                      </div>
                      <h3 className="font-bold text-neutral-900 text-base mb-1.5 leading-tight">Token Economy Systems</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 leading-snug mb-3">
                        A token economy system reinforces positive behaviors by allowing children to earn tokens.
                      </p>
                      <div className="flex items-center text-xs text-neutral-400 font-medium">
                        <span>Odyssey Learning</span>
                        <span className="mx-1.5">•</span>
                        <span>Intermediate</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white border-t border-neutral-100 px-6 py-4 pb-8 flex justify-between items-center z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button className="flex flex-col items-center gap-1 text-[#2F80ED]">
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-600">
            <Search className="h-6 w-6" />
            <span className="text-[10px] font-medium">Discover</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-600">
            <Users className="h-6 w-6" />
            <span className="text-[10px] font-medium">Students</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-600">
            <Settings className="h-6 w-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-neutral-900 rounded-full z-30"></div>
      </div>
    </div>
  );
}
