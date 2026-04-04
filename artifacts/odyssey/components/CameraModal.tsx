import React, { useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiBase } from "@/contexts/AppContext";

export type CapturedMedia = {
  uri: string;
  type: "image" | "video";
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (media: CapturedMedia) => void;
};

type CameraState = "idle" | "recording" | "processing";

type ProcessingPhase = "compressing" | "uploading" | "attaching";

async function uploadMedia(localUri: string, mimeType: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ext = mimeType.startsWith("video/") ? ".mp4" : ".jpg";
    formData.append("file", blob, `capture${ext}`);
  } else {
    const ext = mimeType.startsWith("video/") ? ".mp4" : ".jpg";
    (formData as any).append("file", {
      uri: localUri,
      name: `capture${ext}`,
      type: mimeType,
    });
  }

  const res = await fetch(`${apiBase()}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}

export function CameraModal({ visible, onClose, onConfirm }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<"picture" | "video">("video");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>("compressing");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const topInset = Platform.OS === "web" ? 44 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const resetState = useCallback(() => {
    setCameraState("idle");
    setProcessingPhase("compressing");
    setRecordingDuration(0);
    setError(null);
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  const handleClose = useCallback(() => {
    if (cameraState === "recording") cameraRef.current?.stopRecording();
    resetState();
    onClose();
  }, [cameraState, resetState, onClose]);

  const processAndAttach = useCallback(
    async (localUri: string, type: "image" | "video") => {
      setCameraState("processing");
      setError(null);

      try {
        const mimeType = type === "video" ? "video/mp4" : "image/jpeg";

        setProcessingPhase("compressing");
        await new Promise((r) => setTimeout(r, 300));

        setProcessingPhase("uploading");
        let finalUri = localUri;
        try {
          finalUri = await uploadMedia(localUri, mimeType);
        } catch {
          finalUri = localUri;
        }

        setProcessingPhase("attaching");
        await new Promise((r) => setTimeout(r, 150));

        onConfirm({ uri: finalUri, type });
        resetState();
        onClose();
      } catch (err) {
        setError("Failed to attach media. Tap to retry or close.");
        setCameraState("idle");
      }
    },
    [onConfirm, resetState, onClose],
  );

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current || cameraState !== "idle") return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) await processAndAttach(photo.uri, "image");
    } catch {
      setError("Camera error. Please try again.");
    }
  }, [cameraState, processAndAttach]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || cameraState !== "idle") return;

    if (!micPermission?.granted) {
      await requestMicPermission();
    }

    setCameraState("recording");
    setRecordingDuration(0);
    durationRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (durationRef.current) clearInterval(durationRef.current);

      if (video?.uri) {
        await processAndAttach(video.uri, "video");
      } else {
        setCameraState("idle");
      }
    } catch {
      if (durationRef.current) clearInterval(durationRef.current);
      setCameraState("idle");
      setError("Recording stopped unexpectedly.");
    }
  }, [cameraState, micPermission, requestMicPermission, processAndAttach]);

  const stopRecording = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
    cameraRef.current?.stopRecording();
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const phaseLabel: Record<ProcessingPhase, string> = {
    compressing: "Compressing…",
    uploading: "Uploading…",
    attaching: "Attaching to step…",
  };

  if (!visible) return null;

  if (!cameraPermission) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <View style={styles.permissionContainer}>
          <ActivityIndicator color="#fff" size="large" />
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
              await requestMicPermission();
            }}
          >
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={handleClose}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode={mode}
        />

        {/* Processing overlay — covers everything while compressing/uploading */}
        {cameraState === "processing" && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.processingLabel}>{phaseLabel[processingPhase]}</Text>
              <View style={styles.processingSteps}>
                {(["compressing", "uploading", "attaching"] as ProcessingPhase[]).map((p) => (
                  <View key={p} style={styles.processingStep}>
                    {processingPhase === p ? (
                      <View style={styles.processingStepDotActive} />
                    ) : (
                      <Ionicons
                        name={
                          ["compressing", "uploading", "attaching"].indexOf(p) <
                          ["compressing", "uploading", "attaching"].indexOf(processingPhase)
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={14}
                        color={
                          ["compressing", "uploading", "attaching"].indexOf(p) <
                          ["compressing", "uploading", "attaching"].indexOf(processingPhase)
                            ? "#4ade80"
                            : "rgba(255,255,255,0.3)"
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.processingStepText,
                        processingPhase === p && styles.processingStepTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Error toast */}
        {error && cameraState === "idle" && (
          <View style={[styles.errorBanner, { top: topInset + 60 }]}>
            <Ionicons name="warning" size={16} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleClose}
            disabled={cameraState === "processing"}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          {cameraState === "recording" && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            disabled={cameraState !== "idle"}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        {cameraState !== "processing" && (
          <View style={[styles.bottomBar, { paddingBottom: bottomInset + 24 }]}>
            {/* Mode pill — hidden during recording */}
            {cameraState === "idle" && (
              <View style={styles.modeRow}>
                <TouchableOpacity
                  onPress={() => setMode("picture")}
                  style={[styles.modeTab, mode === "picture" && styles.modeTabActive]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={15}
                    color={mode === "picture" ? "#000" : "rgba(255,255,255,0.75)"}
                  />
                  <Text style={[styles.modeTabText, mode === "picture" && styles.modeTabTextActive]}>
                    Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("video")}
                  style={[styles.modeTab, mode === "video" && styles.modeTabActive]}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={15}
                    color={mode === "video" ? "#000" : "rgba(255,255,255,0.75)"}
                  />
                  <Text style={[styles.modeTabText, mode === "video" && styles.modeTabTextActive]}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Shutter / record button */}
            <View style={styles.shutterRow}>
              <View style={styles.shutterSpacer} />

              {mode === "picture" ? (
                <TouchableOpacity
                  style={styles.shutterBtn}
                  onPress={capturePhoto}
                  disabled={cameraState !== "idle"}
                >
                  <View style={styles.shutterPhoto} />
                </TouchableOpacity>
              ) : cameraState === "idle" ? (
                <TouchableOpacity style={styles.shutterBtn} onPress={startRecording}>
                  <View style={styles.shutterStart} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.shutterBtn, styles.shutterBtnRecording]} onPress={stopRecording}>
                  <View style={styles.shutterStop} />
                </TouchableOpacity>
              )}

              <View style={styles.shutterSpacer} />
            </View>

            <Text style={styles.hint}>
              {mode === "picture"
                ? "Tap to take photo — attaches instantly"
                : cameraState === "idle"
                ? "Tap to start recording"
                : "Tap to stop — video attaches automatically"}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  permissionContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" },
  permissionSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: "#2F80ED",
    paddingHorizontal: 36,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
  },
  permissionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelLink: { marginTop: 4 },
  cancelLinkText: { color: "rgba(255,255,255,0.45)", fontSize: 15 },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  processingCard: {
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  processingLabel: { color: "#fff", fontSize: 18, fontWeight: "700" },
  processingSteps: { gap: 10, alignSelf: "stretch" },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  processingStepDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2F80ED",
  },
  processingStepText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  processingStepTextActive: { color: "#fff", fontWeight: "700" },

  errorBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 15,
  },
  errorText: { color: "#fff", fontSize: 13, flex: 1, lineHeight: 18 },

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
  iconBtn: {
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
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  recordingTimer: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14,
    paddingTop: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    padding: 3,
    gap: 2,
  },
  modeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 19,
  },
  modeTabActive: { backgroundColor: "#fff" },
  modeTabText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
  modeTabTextActive: { color: "#000" },

  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  shutterSpacer: { flex: 1 },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnRecording: {
    borderColor: "#ef4444",
  },
  shutterPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  shutterStart: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#ef4444",
  },
  shutterStop: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  hint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 40,
  },
});
