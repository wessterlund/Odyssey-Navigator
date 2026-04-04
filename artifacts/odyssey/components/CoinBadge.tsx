import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

export function CoinBadge({ amount, size = "md" }: CoinBadgeProps) {
  const colors = useColors();
  const iconSize = size === "sm" ? 14 : size === "md" ? 18 : 24;
  const fontSize = size === "sm" ? 13 : size === "md" ? 16 : 22;

  return (
    <View style={[styles.container, { backgroundColor: colors.coinBg }]}>
      <Ionicons name="star" size={iconSize} color={colors.coin} />
      <Text style={[styles.text, { color: colors.coin, fontSize }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontWeight: "700",
  },
});
