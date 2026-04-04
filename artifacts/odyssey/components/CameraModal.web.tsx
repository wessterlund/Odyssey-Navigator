import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
type ProcessingPhase = "uploading" | "attaching";

async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const res = await fetch(`${apiBase()}/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return (await res.json()).url as string;
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

export function CameraModal({ visible, onClose, onConfirm }: Props) {
  // --- Stable callback refs: always current, never stale ---
  const onConfirmRef = useRef(onConfirm);
  const onCloseRef = useRef(onClose);
  onConfirmRef.current = onConfirm;   // update every render, no useEffect needed
  onCloseRef.current = onClose;

  // --- Media stream state ---
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Direct ref to the <video> DOM element — avoids getElementById which fails in Modal portals
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- UI state ---
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [mode, setMode] = useState<"photo" | "video">("video");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>("uploading");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // --- processAndAttach stored in a ref so recorder.onstop always has the latest ---
  // Assigned on every render so it always closes over fresh state setters and refs.
  const processAndAttachRef = useRef<(blob: Blob, type: "image" | "video") => Promise<void>>();
  processAndAttachRef.current = async (blob, type) => {
    setCameraState("processing");
    setError(null);
    setProcessingPhase("uploading");
    try {
      const ext = type === "video" ? "webm" : "jpg";
      const url = await uploadBlob(blob, `capture.${ext}`);
      setProcessingPhase("attaching");
      await new Promise((r) => setTimeout(r, 80));
      // Stop stream before handing off
      stopStream();
      // onConfirmRef.current is always the latest handleCameraConfirm from create.tsx
      onConfirmRef.current({ uri: url, type });
    } catch (e) {
      console.error("[CameraModal] upload error:", e);
      setError("Upload failed — please try again.");
      setCameraState("idle");
    }
  };

  // --- Stream management ---
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startStream = async (facingMode: "user" | "environment") => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      setPermissionDenied(false);
      // videoRef.current is set because React commits the DOM before effects fire.
      // No getElementById/setTimeout needed — the ref is always the live element.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setPermissionDenied(true);
    }
  };

  // Start/stop camera when visibility changes
  useEffect(() => {
    if (visible) {
      setError(null);
      setPermissionDenied(false);
      setCameraState("idle");
      setRecordingDuration(0);
      setMode("video");
      startStream("environment");
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // --- Handlers ---
  const handleClose = () => {
    if (recorderRef.current && cameraState === "recording") {
      recorderRef.current.stop();
    }
    stopStream();
    setCameraState("idle");
    setRecordingDuration(0);
    setError(null);
    onCloseRef.current();
  };

  const capturePhoto = async () => {
    if (cameraState !== "idle") return;
    const el = videoRef.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth || 1280;
    canvas.height = el.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(el, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob && processAndAttachRef.current) {
          processAndAttachRef.current(blob, "image");
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  const startRecording = () => {
    if (!streamRef.current || cameraState !== "idle") return;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 1_500_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const cleanMime = mimeType.split(";")[0]; // "video/webm"
      const blob = new Blob(chunksRef.current, { type: cleanMime });
      // Always calls latest processAndAttach via ref — no stale closure
      if (processAndAttachRef.current) {
        await processAndAttachRef.current(blob, "video");
      }
    };
    recorder.start(100);
    recorderRef.current = recorder;
    setCameraState("recording");
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current && cameraState === "recording") {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current.stop();
    }
  };

  const flipCamera = async () => {
    const newFacing = facing === "environment" ? "user" : "environment";
    setFacing(newFacing);
    await startStream(newFacing);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Live camera viewfinder */}
        {React.createElement("video", {
          ref: videoRef,
          autoPlay: true,
          muted: true,
          playsInline: true,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            backgroundColor: "#000",
            transform: facing === "user" ? "scaleX(-1)" : "none",
          },
        })}

        {/* Processing overlay */}
        {cameraState === "processing" && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.processingLabel}>
                {processingPhase === "uploading" ? "Uploading…" : "Attaching to step…"}
              </Text>
              <View style={styles.phaseRow}>
                {(["uploading", "attaching"] as ProcessingPhase[]).map((p) => (
                  <View key={p} style={styles.phaseItem}>
                    <Ionicons
                      name={
                        processingPhase === p
                          ? "radio-button-on"
                          : p === "uploading" && processingPhase === "attaching"
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={14}
                      color={
                        processingPhase === p
                          ? "#fff"
                          : p === "uploading" && processingPhase === "attaching"
                          ? "#4CD964"
                          : "rgba(255,255,255,0.4)"
                      }
                    />
                    <Text style={styles.phaseLabel}>
                      {p === "uploading" ? "Uploading" : "Attaching"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Permission denied */}
        {permissionDenied && (
          <View style={styles.permissionCard}>
            <Ionicons name="camera-off-outline" size={48} color="#fff" />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionSub}>
              Allow camera and microphone access in your browser settings, then close and reopen.
            </Text>
            <TouchableOpacity style={styles.closeFromPermission} onPress={handleClose}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top bar */}
        {cameraState !== "processing" && (
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBtn} onPress={handleClose}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>

            {cameraState === "recording" ? (
              <View style={styles.recDot}>
                <View style={styles.recDotCircle} />
                <Text style={styles.recTimer}>{fmt(recordingDuration)}</Text>
              </View>
            ) : (
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "photo" && styles.modeBtnActive]}
                  onPress={() => setMode("photo")}
                >
                  <Text style={[styles.modeBtnText, mode === "photo" && styles.modeBtnTextActive]}>
                    Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "video" && styles.modeBtnActive]}
                  onPress={() => setMode("video")}
                >
                  <Text style={[styles.modeBtnText, mode === "video" && styles.modeBtnTextActive]}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.topBtn}
              onPress={flipCamera}
              disabled={cameraState === "recording"}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom shutter/record controls */}
        {cameraState !== "processing" && !permissionDenied && (
          <View style={styles.bottomBar}>
            {mode === "photo" ? (
              <TouchableOpacity style={styles.shutterBtn} onPress={capturePhoto}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            ) : cameraState === "idle" ? (
              <TouchableOpacity style={styles.recBtn} onPress={startRecording}>
                <View style={styles.recBtnInner} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                <View style={styles.stopBtnInner} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", position: "relative" },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  processingCard: { alignItems: "center", gap: 16, padding: 32 },
  processingLabel: { color: "#fff", fontSize: 18, fontWeight: "700" },
  phaseRow: { flexDirection: "row", gap: 20, marginTop: 8 },
  phaseItem: { alignItems: "center", gap: 4 },
  phaseLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  errorBanner: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(200,50,50,0.9)",
    borderRadius: 12,
    padding: 14,
    zIndex: 15,
  },
  errorText: { color: "#fff", textAlign: "center", fontSize: 14, fontWeight: "600" },
  permissionCard: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 40,
    zIndex: 10,
  },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" },
  permissionSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  closeFromPermission: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#fff",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  recDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recDotCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF3B30" },
  recTimer: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 3,
  },
  modeBtn: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 17 },
  modeBtnActive: { backgroundColor: "#fff" },
  modeBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },
  modeBtnTextActive: { color: "#000" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  recBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  recBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#FF3B30" },
  stopBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtnInner: { width: 30, height: 30, borderRadius: 4, backgroundColor: "#FF3B30" },
});
