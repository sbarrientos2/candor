import * as Location from "expo-location";
import { decode } from "base64-arraybuffer";
import { hashImageFile, hashToBytes } from "../utils/crypto";

export interface CaptureMetadata {
  imageUri: string;
  imageHash: string;
  imageHashBytes: number[];
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  isMocked: boolean;
  timestamp: number;
}

/**
 * Fuzzy GPS coordinates for privacy.
 * Rounds to ~3 decimal places (~111m accuracy).
 */
function fuzzyCoord(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

/**
 * The sealed pipeline: capture metadata from an image file.
 * Runs automatically after shutter tap — no user interaction allowed.
 *
 * 1. Read image bytes and compute SHA-256 hash
 * 2. Optionally capture GPS location (fuzzied for privacy)
 * 3. Bundle everything together
 */
export async function sealedPipeline(
  imageUri: string,
  includeLocation: boolean = false
): Promise<CaptureMetadata> {
  // Step 1: Hash the image
  const imageHash = await hashImageFile(imageUri);
  const imageHashBytes = hashToBytes(imageHash);

  // Step 2: Get GPS location (only if user opted in)
  let latitude: number | null = null;
  let longitude: number | null = null;
  let locationAccuracy: number | null = null;
  let isMocked = false;

  if (includeLocation) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        // Fuzzy to ~111m for privacy
        latitude = fuzzyCoord(location.coords.latitude);
        longitude = fuzzyCoord(location.coords.longitude);
        locationAccuracy = location.coords.accuracy ?? null;
        isMocked = (location as any).mocked === true;
      }
    } catch {
      // Location failed — continue without it
    }
  }

  return {
    imageUri,
    imageHash,
    imageHashBytes,
    latitude,
    longitude,
    locationAccuracy,
    isMocked,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * Upload image to Supabase Storage and return the public URL.
 */
export async function uploadImage(
  supabase: any,
  imageUri: string,
  walletAddress: string
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Convert blob to base64
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.readAsDataURL(blob);
  });

  const fileName = `${walletAddress}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("photos")
    .upload(fileName, decode(base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload avatar to Supabase Storage and return the public URL.
 * Uses upsert to overwrite previous avatar. Deterministic path per wallet.
 */
export async function uploadAvatar(
  supabase: any,
  imageUri: string,
  walletAddress: string
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.readAsDataURL(blob);
  });

  const fileName = `avatars/${walletAddress}.jpg`;

  // Remove existing avatar first (ignore errors — file may not exist yet)
  await supabase.storage.from("photos").remove([fileName]);

  const { error } = await supabase.storage
    .from("photos")
    .upload(fileName, decode(base64), {
      contentType: "image/jpeg",
    });

  if (error) throw error;

  const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
  return `${data.publicUrl}?t=${Date.now()}`;
}
