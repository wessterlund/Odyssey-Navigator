import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  uri: string;
  mediaType: "image" | "video";
  style?: object;
  resizeMode?: "cover" | "contain";
}

export function MediaPreview({ uri, mediaType, style, resizeMode = "cover" }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        style={styles.fill}
        contentFit={resizeMode}
      />
      {mediaType === "video" && (
        <View style={styles.videoOverlay}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", overflow: "hidden", position: "relative" },
  fill: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
