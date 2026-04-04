import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentLearner, wallet, transactions, loading, loadWallet, loadTransactions } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) {
      loadWallet(currentLearner.id);
      loadTransactions(currentLearner.id);
    }
  }, [currentLearner?.id]);

  const onRefresh = async () => {
    if (currentLearner) {
      await loadWallet(currentLearner.id);
      await loadTransactions(currentLearner.id);
    }
  };

  if (!currentLearner || !wallet) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="star-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No wallet found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: bottomInset + 90 },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Wallet</Text>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.balanceLabel, { color: "rgba(255,255,255,0.75)" }]}>
          Available Coins
        </Text>
        <View style={styles.balanceRow}>
          <Ionicons name="star" size={36} color="#FFD700" />
          <Text style={styles.balanceAmount}>{wallet.coins}</Text>
        </View>
        <View style={styles.lifetimeRow}>
          <Text style={[styles.lifetimeLabel, { color: "rgba(255,255,255,0.75)" }]}>
            Lifetime earned:
          </Text>
          <Text style={styles.lifetimeAmount}>{wallet.lifetimeCoins}</Text>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>History</Text>
        {transactions.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No transactions yet
            </Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor:
                      tx.type === "earn" ? colors.coinBg : "#FEE2E2",
                  },
                ]}
              >
                <Ionicons
                  name={tx.type === "earn" ? "add-circle" : "remove-circle"}
                  size={20}
                  color={tx.type === "earn" ? colors.coin : colors.destructive}
                />
              </View>
              <View style={styles.txContent}>
                <Text style={[styles.txLabel, { color: colors.foreground }]}>
                  {tx.note || (tx.source === "step" ? "Step completed" : tx.source === "completion" ? "Adventure completed!" : "Reward redeemed")}
                </Text>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === "earn" ? colors.coin : colors.destructive },
                ]}
              >
                {tx.type === "earn" ? "+" : "-"}{tx.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 26, fontWeight: "700" },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: { fontSize: 14, fontWeight: "500" },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceAmount: { fontSize: 52, fontWeight: "800", color: "#ffffff" },
  lifetimeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  lifetimeLabel: { fontSize: 13 },
  lifetimeAmount: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  emptyHistory: { borderRadius: 14, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14 },
  txItem: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txContent: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, fontWeight: "600" },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: "700" },
});
