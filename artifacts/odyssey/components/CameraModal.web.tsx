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
  onReplace?: (oldUri: string, newUri: string) => void;
};

type CameraState = "idle" | "recording" | "uploading";

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

export function CameraModal({ visible, onClose, onConfirm, onReplace }: Props) {
  // --- Always-fresh callback refs (updated every render, no stale closure possible) ---
  const onConfirmRef = useRef(onConfirm);
  const onCloseRef = useRef(onClose);
  const onReplaceRef = useRef(onReplace);
  onConfirmRef.current = onConfirm;
  onCloseRef.current = onClose;
  onReplaceRef.current = onReplace;

  // --- Hardware refs ---
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Direct React ref to the <video> element — getElementById fails in Modal portals
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- UI state ---
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [mode, setMode] = useState<"photo" | "video">("video");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // Spec Step 1 — openCamera: get stream, attach to video element
  const startStream = async (facingMode: "user" | "environment") => {
    stopStream();
    setError(null);
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      // videoRef.current is guaranteed set here: React commits refs before effects fire
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    if (visible) {
      setCameraState("idle");
      setRecordingDuration(0);
      setError(null);
      setUploading(false);
      setMode("video");
      startStream("environment");
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  // Spec Step 2 — startRecording: create MediaRecorder, set ondataavailable, start
  // NOTE: onstop is NOT set here — it is set inside stopRecording (Spec Step 3)
  const startRecording = () => {
    if (!streamRef.current || cameraState !== "idle") return;
    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(streamRef.current, { mimeType });
    } catch {
      // Fallback without codec params
      recorder = new MediaRecorder(streamRef.current);
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(); // no timeslice — fires ondataavailable once at stop
    recorderRef.current = recorder;
    setCameraState("recording");
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  };

  // Spec Step 3 — stopRecording: set onstop THEN call stop()
  // Spec Step 6-8: immediate blob URL preview → background server upload → URL swap
  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || cameraState !== "recording") return;
    if (timerRef.current) clearInterval(timerRef.current);

    // CRITICAL: set onstop before stop() per spec
    recorder.onstop = async () => {
      const cleanMime = (recorder.mimeType || "video/webm").split(";")[0];
      const blob = new Blob(chunksRef.current, { type: cleanMime });

      // Spec Step 4 — debug blob size
      console.log("[CameraModal] Recorded blob size:", blob.size, "type:", cleanMime);

      if (blob.size === 0) {
        setError("Recording is empty — please try again.");
        setCameraState("idle");
        return;
      }

      // Spec Step 6 — immediate preview via blob URL (no upload needed yet)
      const blobUrl = URL.createObjectURL(blob);
      stopStream();
      // Step attaches immediately, modal closes, user sees preview right away
      onConfirmRef.current({ uri: blobUrl, type: "video" });

      // Spec Step 7 — background upload: swap blob URL with durable server URL
      setUploading(true);
      try {
        const serverUrl = await uploadBlob(blob, "capture.webm");
        console.log("[CameraModal] Uploaded to:", serverUrl);
        onReplaceRef.current?.(blobUrl, serverUrl);
        URL.revokeObjectURL(blobUrl); // free memory
      } catch (e) {
        console.error("[CameraModal] Background upload failed:", e);
        // Preview still works with blob URL for the current session
      }
      setUploading(false);
    };

    recorder.stop(); // triggers onstop above
    setCameraState("idle");
  };

  // Photo capture: same immediate-preview + background-upload pattern
  const capturePhoto = () => {
    if (cameraState !== "idle") return;
    const el = videoRef.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth || 1280;
    canvas.height = el.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(el, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        console.log("[CameraModal] Photo blob size:", blob.size);
        const blobUrl = URL.createObjectURL(blob);
        stopStream();
        onConfirmRef.current({ uri: blobUrl, type: "image" });

        try {
          const serverUrl = await uploadBlob(blob, "capture.jpg");
          onReplaceRef.current?.(blobUrl, serverUrl);
          URL.revokeObjectURL(blobUrl);
        } catch (e) {
          console.error("[CameraModal] Photo upload failed:", e);
        }
      },
      "image/jpeg",
      0.85,
    );
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
        {/* Spec Step 1 — live camera preview using React ref (not getElementById) */}
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

        {/* Bottom controls */}
        {!permissionDenied && (
          <View style={styles.bottomBar}>
            {mode === "photo" ? (
              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={capturePhoto}
                disabled={cameraState !== "idle"}
              >
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

        {/* Background upload indicator (shown after modal would normally close — but this
            renders briefly; parent step card shows blob URL preview immediately) */}
        {uploading && (
          <View style={styles.uploadingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.uploadingText}>Saving to server…</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", position: "relative" },
  errorBanner: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(200,50,50,0.92)",
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
    backgroundColor: "rgba(0,0,0,0.85)",
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
  uploadingBadge: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadingText: { color: "#fff", fontSize: 13 },
});
