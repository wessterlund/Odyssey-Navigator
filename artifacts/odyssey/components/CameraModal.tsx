import React, { useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CapturedMedia = {
  uri: string;
  type: "image" | "video";
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (media: CapturedMedia) => void;
};

type RecordingState = "idle" | "recording" | "preview";

export function CameraModal({ visible, onClose, onConfirm }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const topInset = Platform.OS === "web" ? 44 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const resetState = useCallback(() => {
    setRecordingState("idle");
    setCapturedMedia(null);
    setRecordingDuration(0);
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  const handleClose = useCallback(() => {
    if (recordingState === "recording") {
      cameraRef.current?.stopRecording();
    }
    resetState();
    onClose();
  }, [recordingState, resetState, onClose]);

  const handleRetake = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleConfirm = useCallback(() => {
    if (capturedMedia) {
      onConfirm(capturedMedia);
      resetState();
      onClose();
    }
  }, [capturedMedia, onConfirm, resetState, onClose]);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setCapturedMedia({ uri: photo.uri, type: "image" });
        setRecordingState("preview");
      }
    } catch {
      // Camera unavailable — silently ignore
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    setRecordingState("recording");
    setRecordingDuration(0);
    durationRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (durationRef.current) clearInterval(durationRef.current);
      if (video?.uri) {
        setCapturedMedia({ uri: video.uri, type: "video" });
        setRecordingState("preview");
      } else {
        setRecordingState("idle");
      }
    } catch {
      if (durationRef.current) clearInterval(durationRef.current);
      setRecordingState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
    cameraRef.current?.stopRecording();
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!visible) return null;

  // --- Permission gates ---
  if (!cameraPermission) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <View style={styles.permissionContainer}>
          <ActivityIndicator color="#fff" />
        </View>
      </Modal>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.6)" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>
            Allow camera access to record videos and take photos for adventure steps.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={async () => {
              await requestCameraPermission();
              if (mode === "video") await requestMicPermission();
            }}
          >
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionClose} onPress={handleClose}>
            <Text style={styles.permissionCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // --- Preview screen (after capture) ---
  if (recordingState === "preview" && capturedMedia) {
    return (
      <Modal visible animationType="fade" statusBarTranslucent>
        <View style={styles.previewContainer}>
          {capturedMedia.type === "image" ? (
            <Image
              source={{ uri: capturedMedia.uri }}
              style={styles.previewMedia}
              contentFit="contain"
            />
          ) : (
            <VideoPreview uri={capturedMedia.uri} />
          )}

          <View style={[styles.previewOverlay, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>

            <View style={styles.previewBadge}>
              <Ionicons
                name={capturedMedia.type === "image" ? "image" : "videocam"}
                size={16}
                color="#fff"
              />
              <Text style={styles.previewBadgeText}>
                {capturedMedia.type === "image" ? "Photo" : "Video"} Preview
              </Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={20} color="#000" />
                <Text style={styles.confirmBtnText}>Use This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // --- Camera viewfinder ---
  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode={mode}
        />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          {recordingState === "recording" && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            disabled={recordingState === "recording"}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 24 }]}>
          {/* Mode switcher */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setMode("picture")}
              disabled={recordingState === "recording"}
              style={[styles.modeTab, mode === "picture" && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === "picture" && styles.modeTabTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (mode !== "video" && !micPermission?.granted) {
                  await requestMicPermission();
                }
                setMode("video");
              }}
              disabled={recordingState === "recording"}
              style={[styles.modeTab, mode === "video" && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === "video" && styles.modeTabTextActive]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Shutter */}
          <View style={styles.shutterRow}>
            <View style={styles.shutterSpacer} />
            {mode === "picture" ? (
              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={capturePhoto}
                disabled={recordingState !== "idle"}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            ) : recordingState === "idle" ? (
              <TouchableOpacity style={styles.shutterBtn} onPress={startRecording}>
                <View style={[styles.shutterInner, styles.shutterRecord]} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.shutterBtn} onPress={stopRecording}>
                <View style={[styles.shutterInner, styles.shutterStop]} />
              </TouchableOpacity>
            )}
            <View style={styles.shutterSpacer} />
          </View>

          <Text style={styles.shutterHint}>
            {mode === "picture"
              ? "Tap to take photo"
              : recordingState === "idle"
              ? "Tap to start recording"
              : "Tap to stop"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// --- VideoPreview: platform-aware video playback ---
function VideoPreview({ uri }: { uri: string }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.previewMedia}>
        {/* @ts-ignore */}
        <video
          src={uri}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
          controls
          autoPlay
          playsInline
        />
      </View>
    );
  }
  // On native without expo-av: show a play-icon placeholder over the thumbnail
  return (
    <View style={[styles.previewMedia, styles.videoPlaceholder]}>
      <Ionicons name="videocam" size={64} color="rgba(255,255,255,0.7)" />
      <Text style={styles.videoReadyText}>Video Ready</Text>
      <Text style={styles.videoReadySubText}>Tap "Use This" to attach it to the step</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" },
  permissionSub: { color: "rgba(255,255,255,0.65)", fontSize: 15, textAlign: "center", lineHeight: 22 },
  permissionBtn: {
    backgroundColor: "#2F80ED",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permissionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  permissionClose: { marginTop: 4 },
  permissionCloseText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },

  cameraContainer: { flex: 1, backgroundColor: "#000" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  recordingTimer: { color: "#fff", fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
    paddingTop: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  modeTab: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 17,
  },
  modeTabActive: { backgroundColor: "#fff" },
  modeTabText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
  modeTabTextActive: { color: "#000" },

  shutterRow: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 40 },
  shutterSpacer: { flex: 1 },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  shutterRecord: {
    backgroundColor: "#ef4444",
    borderRadius: 29,
  },
  shutterStop: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  shutterHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginBottom: 4,
  },

  previewContainer: { flex: 1, backgroundColor: "#000" },
  previewMedia: { flex: 1 },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  previewBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  previewBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  retakeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },

  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  videoReadyText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  videoReadySubText: { color: "rgba(255,255,255,0.65)", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
