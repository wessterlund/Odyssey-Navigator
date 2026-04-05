import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, CheckCircle2, AlertTriangle, MessageCircle, 
  Trophy, Map, Star, Sparkles, X, ChevronRight, Check,
  Compass, Gift, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";

type Urgency = 'routine' | 'attention' | 'urgent';
type ActionType = 'completion' | 'stuck' | 'message' | 'approval';

interface ActionItem {
  id: string;
  studentName: string;
  initials: string;
  type: ActionType;
  description: string;
  timeAgo: string;
  urgency: Urgency;
  primaryAction: string;
  secondaryAction?: string;
}

const INITIAL_INBOX: ActionItem[] = [
  {
    id: '1',
    studentName: 'Mia',
    initials: 'M',
    type: 'stuck',
    description: 'Stuck on Step 3 of Morning Routine — needs encouragement',
    timeAgo: '5m ago',
    urgency: 'urgent',
    primaryAction: 'Send Nudge',
    secondaryAction: 'Skip',
  },
  {
    id: '2',
    studentName: 'Sophie',
    initials: 'S',
    type: 'message',
    description: "Parent sent a message regarding yesterday's progress",
    timeAgo: '12m ago',
    urgency: 'attention',
    primaryAction: 'Reply',
    secondaryAction: 'Mark Read',
  },
  {
    id: '3',
    studentName: 'James',
    initials: 'J',
    type: 'approval',
    description: 'Ready for Reward redemption (15 coins)',
    timeAgo: '1h ago',
    urgency: 'routine',
    primaryAction: 'Approve',
    secondaryAction: 'Review',
  },
  {
    id: '4',
    studentName: 'Carlos',
    initials: 'C',
    type: 'completion',
    description: 'Completed Ocean Deep Adventure',
    timeAgo: '2h ago',
    urgency: 'routine',
    primaryAction: 'Award Coins',
    secondaryAction: 'View',
  }
];

export default function ActionInbox() {
  const [items, setItems] = useState<ActionItem[]>(INITIAL_INBOX);

  const handleAction = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const urgencyColors = {
    urgent: 'border-l-red-500 bg-red-50/50',
    attention: 'border-l-amber-500 bg-amber-50/50',
    routine: 'border-l-[#2F80ED] bg-blue-50/30'
  };

  const ActionIcon = ({ type }: { type: ActionType }) => {
    switch (type) {
      case 'stuck': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-amber-500" />;
      case 'approval': return <Gift className="h-4 w-4 text-[#2F80ED]" />;
      case 'completion': return <Trophy className="h-4 w-4 text-[#2F80ED]" />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 flex flex-col gap-2 z-10 sticky top-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Good Morning, Carlo</h1>
            <p className="text-sm text-gray-500 font-medium">
              5 of 8 students active today
            </p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-[#2F80ED] text-white font-semibold">C</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Action Inbox</h2>
            {items.length > 0 && (
              <Badge className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white border-0 px-1.5 min-w-[1.5rem] flex justify-center">
                {items.length}
              </Badge>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-3 pb-24">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all",
                  "border-l-4", urgencyColors[item.urgency]
                )}
              >
                <div className="p-4 flex gap-3">
                  <div className="relative mt-1">
                    <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                      <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">{item.initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                      <ActionIcon type={item.type} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{item.studentName}</span>
                      <span className="text-xs text-gray-400 font-medium">{item.timeAgo}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug pr-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
                  {item.secondaryAction && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-700 h-8 px-3 text-xs font-medium"
                      onClick={() => handleAction(item.id)}
                    >
                      {item.secondaryAction}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    className={cn(
                      "h-8 px-4 text-xs font-semibold shadow-sm transition-colors",
                      item.urgency === 'urgent' 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
                    )}
                    onClick={() => handleAction(item.id)}
                  >
                    {item.primaryAction}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cleared for today!</h3>
            <p className="text-gray-500 max-w-[250px] text-sm">
              You've handled all pending actions. Enjoy the rest of your day, Carlo.
            </p>
            <Button 
              variant="outline" 
              className="mt-8 text-[#2F80ED] border-[#2F80ED]/20 hover:bg-[#2F80ED]/5 font-medium"
              onClick={() => setItems(INITIAL_INBOX)}
            >
              Reset Mockup
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Features Dock - Fixed Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <button className="flex flex-col items-center gap-1.5 group p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-gray-500">Adventures</span>
          </button>
          
          <button className="flex flex-col items-center gap-1.5 group p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <Star className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-gray-500">Rewards</span>
          </button>
          
          <button className="flex flex-col items-center gap-1.5 group p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 group-hover:scale-105 transition-transform">
              <Flag className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-gray-500">Voyage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
