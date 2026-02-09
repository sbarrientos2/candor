import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";

/**
 * Reads an image file and computes its SHA-256 hash.
 * This is the core of the "sealed pipeline" — no user interaction
 * should occur between capture and hashing.
 *
 * We hash the base64 representation of the file, which is deterministic
 * for the same file content.
 */
export async function hashImageFile(fileUri: string): Promise<string> {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Compute SHA-256 digest of the base64 content
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64
  );

  return hash;
}

/**
 * Converts a hex hash string to a 32-byte array for on-chain storage.
 */
export function hashToBytes(hexHash: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hexHash.length; i += 2) {
    bytes.push(parseInt(hexHash.substring(i, i + 2), 16));
  }
  return bytes;
}
