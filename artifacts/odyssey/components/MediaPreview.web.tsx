import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  uri: string;
  mediaType: "image" | "video";
  style?: object;
  resizeMode?: "cover" | "contain";
}

export function MediaPreview({ uri, mediaType, style, resizeMode = "cover" }: Props) {
  const objectFit = resizeMode === "contain" ? "contain" : "cover";

  if (mediaType === "video") {
    return (
      <View style={[styles.container, style]}>
        {React.createElement("video", {
          src: uri,
          controls: true,
          playsInline: true,
          style: {
            width: "100%",
            height: "100%",
            objectFit,
            display: "block",
            backgroundColor: "#000",
          },
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {React.createElement("img", {
        src: uri,
        style: {
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
        },
        alt: "Step media",
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", overflow: "hidden" },
});
