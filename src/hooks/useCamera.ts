import { useState, useCallback, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { sealedPipeline, CaptureMetadata } from "../services/verification";

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCapture] = useState<CaptureMetadata | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const capture = useCallback(async (includeLocation: boolean = false): Promise<CaptureMetadata | null> => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error("Camera capture returned no photo");
      }

      // Run sealed pipeline: hash + optional GPS
      const metadata = await sealedPipeline(photo.uri, includeLocation);
      setLastCapture(metadata);
      return metadata;
    } catch (error) {
      console.error("Camera capture failed:", error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    permission,
    requestPermission,
    isCapturing,
    lastCapture,
    capture,
    clearCapture: () => setLastCapture(null),
  };
}
