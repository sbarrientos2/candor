import { useState, useCallback } from "react";
import { useConnection } from "../utils/ConnectionProvider";
import { useWallet } from "./useWallet";
import { buildVerifyPhotoTransaction } from "../services/anchor";
import { uploadImage, CaptureMetadata } from "../services/verification";
import { supabase } from "../services/supabase";
import { PROGRAM_ID } from "../services/solana";
import { PhotoUploadData } from "../types";

// Program is deployed when ID is not the placeholder
const PROGRAM_DEPLOYED =
  PROGRAM_ID.toBase58() !== "11111111111111111111111111111111";

export function useVerification() {
  const { connection } = useConnection();
  const { publicKey, walletAddress, signAndSendTransaction } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAndUpload = useCallback(
    async (
      metadata: CaptureMetadata,
      caption: string
    ): Promise<PhotoUploadData | null> => {
      if (!publicKey || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }

      setIsVerifying(true);
      setError(null);

      try {
        let txSignature: string | null = null;

        // On-chain verification (only if program is deployed)
        if (PROGRAM_DEPLOYED) {
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();

          const tx = buildVerifyPhotoTransaction(
            publicKey,
            metadata.imageHashBytes,
            metadata.latitude ?? 0,
            metadata.longitude ?? 0,
            metadata.timestamp,
            blockhash
          );

          const slot = await connection.getSlot();
          txSignature = await signAndSendTransaction(tx, slot);

          await connection.confirmTransaction(
            {
              signature: txSignature,
              blockhash,
              lastValidBlockHeight,
            },
            "confirmed"
          );
        }

        // Upload image to Supabase Storage
        const imageUrl = await uploadImage(
          supabase,
          metadata.imageUri,
          walletAddress
        );

        // Insert photo record in Supabase
        const { error: insertError } = await supabase.from("photos").insert({
          creator_wallet: walletAddress,
          image_url: imageUrl,
          image_hash: metadata.imageHash,
          caption: caption || null,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          location_accuracy: metadata.locationAccuracy,
          verification_tx: txSignature,
        });

        if (insertError) throw insertError;

        return {
          imageUri: metadata.imageUri,
          imageHash: metadata.imageHash,
          caption,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          locationAccuracy: metadata.locationAccuracy,
          verificationTx: txSignature ?? "",
          creatorWallet: walletAddress,
        };
      } catch (err: any) {
        console.error("Verification failed:", err);
        setError(err.message || "Verification failed");
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    [connection, publicKey, walletAddress, signAndSendTransaction]
  );

  return {
    verifyAndUpload,
    isVerifying,
    error,
    clearError: () => setError(null),
  };
}
