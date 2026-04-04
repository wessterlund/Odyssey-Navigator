import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.min(100, Math.max(0, progress)), {
      damping: 20,
      stiffness: 90,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: colors.muted, borderRadius: height / 2 },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          animatedStyle,
          {
            backgroundColor: color || colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
