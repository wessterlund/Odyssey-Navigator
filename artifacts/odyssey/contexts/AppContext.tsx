import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export interface Learner {
  id: number;
  name: string;
  birthday: string;
  diagnosis?: string;
  therapies?: string[];
  school?: string;
  class?: string;
  capabilities?: string[];
  interests?: string[];
  favorites?: string[];
  challenges?: string[];
  learningGoals?: string[];
  longTermGoals?: string[];
}

export interface Step {
  id?: number;
  adventureId?: number;
  instruction: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  thumbnail?: string;
  tip?: string;
  order?: number;
  mediaSuggestion?: string;
}

export interface Adventure {
  id: number;
  learnerId: number;
  title: string;
  description?: string;
  coinsPerStep: number;
  completionBonus: number;
  isTemplate?: boolean;
  isDraft?: boolean;
  isPublished?: boolean;
  thumbnailUrl?: string;
  usageCount?: number;
  lastCompletedAt?: string;
  steps: Step[];
}

export interface Wallet {
  id: number;
  learnerId: number;
  coins: number;
  lifetimeCoins: number;
}

export interface Reward {
  id: number;
  learnerId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  cost: number;
  cooldown?: number;
  redeemed?: boolean;
  startDate?: string;
  endDate?: string;
  timeWindow?: string;
  linkedAdventures?: number[];
  isDraft?: boolean;
  isPublished?: boolean;
  isTemplate?: boolean;
  createdAt?: string;
}

export interface Transaction {
  id: number;
  learnerId: number;
  type: "earn" | "redeem";
  amount: number;
  source: "step" | "completion" | "reward";
  note?: string;
  createdAt: string;
}

interface AppContextType {
  learners: Learner[];
  currentLearner: Learner | null;
  adventures: Adventure[];
  wallet: Wallet | null;
  rewards: Reward[];
  transactions: Transaction[];
  loading: boolean;
  setCurrentLearner: (learner: Learner | null) => void;
  loadLearners: () => Promise<void>;
  loadAdventures: (learnerId: number) => Promise<void>;
  loadWallet: (learnerId: number) => Promise<void>;
  loadRewards: (learnerId: number) => Promise<void>;
  loadTransactions: (learnerId: number) => Promise<void>;
  refreshAll: (learnerId: number) => Promise<void>;
  role: "teacher" | "parent" | "student";
  setRole: (role: "teacher" | "parent" | "student") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [currentLearner, setCurrentLearnerState] = useState<Learner | null>(null);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRoleState] = useState<"teacher" | "parent" | "student">("teacher");

  const setRole = useCallback(async (r: "teacher" | "parent" | "student") => {
    setRoleState(r);
    await AsyncStorage.setItem("appRole", r);
  }, []);

  const apiGet = async (path: string) => {
    const res = await fetch(`${BASE_URL}/api${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };

  const loadLearners = useCallback(async () => {
    try {
      const data = await apiGet("/learners");
      setLearners(data);
    } catch (e) {
      console.error("loadLearners error", e);
    }
  }, []);

  const loadAdventures = useCallback(async (learnerId: number) => {
    try {
      const data = await apiGet(`/adventures/learner/${learnerId}`);
      setAdventures(data);
    } catch (e) {
      console.error("loadAdventures error", e);
    }
  }, []);

  const loadWallet = useCallback(async (learnerId: number) => {
    try {
      const data = await apiGet(`/wallet/learner/${learnerId}`);
      setWallet(data);
    } catch (e) {
      console.error("loadWallet error", e);
    }
  }, []);

  const loadRewards = useCallback(async (learnerId: number) => {
    try {
      const data = await apiGet(`/rewards/learner/${learnerId}`);
      setRewards(data);
    } catch (e) {
      console.error("loadRewards error", e);
    }
  }, []);

  const loadTransactions = useCallback(async (learnerId: number) => {
    try {
      const data = await apiGet(`/wallet/learner/${learnerId}/transactions`);
      setTransactions(data);
    } catch (e) {
      console.error("loadTransactions error", e);
    }
  }, []);

  const refreshAll = useCallback(
    async (learnerId: number) => {
      setLoading(true);
      await Promise.all([
        loadAdventures(learnerId),
        loadWallet(learnerId),
        loadRewards(learnerId),
        loadTransactions(learnerId),
      ]);
      setLoading(false);
    },
    [loadAdventures, loadWallet, loadRewards, loadTransactions]
  );

  const setCurrentLearner = useCallback(async (learner: Learner | null) => {
    setCurrentLearnerState(learner);
    if (learner) {
      await AsyncStorage.setItem("currentLearnerId", String(learner.id));
    } else {
      await AsyncStorage.removeItem("currentLearnerId");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadLearners();
      const storedRole = await AsyncStorage.getItem("appRole");
      if (storedRole === "teacher" || storedRole === "parent" || storedRole === "student") {
        setRoleState(storedRole);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const restoreCurrentLearner = async () => {
      const storedId = await AsyncStorage.getItem("currentLearnerId");
      if (learners.length > 0) {
        const found = storedId ? learners.find((l) => String(l.id) === storedId) : null;
        const learner = found ?? learners[0];
        if (learner) {
          setCurrentLearnerState(learner);
          refreshAll(learner.id);
        }
      }
    };
    if (learners.length > 0) restoreCurrentLearner();
  }, [learners]);

  return (
    <AppContext.Provider
      value={{
        learners,
        currentLearner,
        adventures,
        wallet,
        rewards,
        transactions,
        loading,
        setCurrentLearner,
        loadLearners,
        loadAdventures,
        loadWallet,
        loadRewards,
        loadTransactions,
        refreshAll,
        role,
        setRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const apiBase = () => `${BASE_URL}/api`;
