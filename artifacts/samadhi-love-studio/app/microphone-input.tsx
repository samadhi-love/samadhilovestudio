"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpField } from "./help-tip";

export function useMicrophoneInputs() {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [supported, setSupported] = useState(false);

  const refresh = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputs(devices.filter(input => input.kind === "audioinput" && input.deviceId && input.deviceId !== "default"));
  }, []);

  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia || !media.enumerateDevices || typeof MediaRecorder === "undefined") return;
    setSupported(true);
    const update = () => { void refresh().catch(() => {}); };
    update();
    media.addEventListener("devicechange", update);
    return () => media.removeEventListener("devicechange", update);
  }, [refresh]);

  return { inputs, device, setDevice, supported, refresh };
}

export function MicrophoneInput({ microphone }: { microphone: ReturnType<typeof useMicrophoneInputs> }) {
  const { inputs, device, setDevice, supported } = microphone;
  const missing = device && !inputs.some(input => input.deviceId === device);
  return <HelpField label="Microphone input" tip="Choose your built-in mic, USB mic, or audio interface such as a Focusrite Scarlett. If you only see System default, select Allow microphone to reveal device names.">
    <select value={device} disabled={!supported} onChange={event => setDevice(event.target.value)}>
      <option value="">System default</option>
      {missing && <option value={device}>Previously selected input (unavailable)</option>}
      {inputs.map((input, index) => <option key={input.deviceId} value={input.deviceId}>{input.label || "Microphone " + (index + 1)}</option>)}
    </select>
  </HelpField>;
}

export async function allowMicrophone(refresh: () => Promise<void>) {
  // Enumerate while the stream is active so browsers that hide labels can reveal them.
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try { await refresh(); }
  finally { stream.getTracks().forEach(track => track.stop()); }
}

export function microphoneError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access is blocked. Open Studio directly and allow microphone access in your browser.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "The microphone is unavailable. Reconnect your interface or choose a different input.";
  if (name === "NotReadableError")
    return "The microphone could not open. Check the connection and close other apps using that input.";
  return "The microphone could not start. Check your input device or import an audio file.";
}
