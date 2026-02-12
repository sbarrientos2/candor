import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "../utils/ConnectionProvider";
import { useWallet } from "./useWallet";
import { buildVouchTransaction } from "../services/anchor";
import { getPhotoRecordPDA } from "../services/solana";
import { supabase } from "../services/supabase";
import { hashToBytes } from "../utils/crypto";
import { formatSOL } from "../utils/format";

const DEFAULT_VOUCH_LAMPORTS = 5_000_000; // 0.005 SOL
const ESTIMATED_FEE = 15_000; // tx fee + rent buffer in lamports

export function useVouch() {
  const { connection } = useConnection();
  const { publicKey, walletAddress, signAndSendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [isVouching, setIsVouching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ amount: number } | null>(null);

  const vouch = useCallback(
    async (
      photoId: string,
      creatorWallet: string,
      imageHash: string,
      amountLamports: number = DEFAULT_VOUCH_LAMPORTS
    ): Promise<string | null> => {
      if (!publicKey || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }

      if (walletAddress === creatorWallet) {
        setError("Cannot vouch for your own photo");
        return null;
      }

      setIsVouching(true);
      setError(null);

      try {
        // Pre-flight balance check
        const balance = await connection.getBalance(publicKey);
        const required = amountLamports + ESTIMATED_FEE;
        if (balance < required) {
          setError(
            `Insufficient SOL. You need ${formatSOL(required)} but only have ${formatSOL(balance)}.`
          );
          return null;
        }

        const creatorPubkey = new PublicKey(creatorWallet);
        const hashBytes = hashToBytes(imageHash);
        const [photoRecordPDA] = getPhotoRecordPDA(
          creatorPubkey,
          Buffer.from(hashBytes)
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const tx = buildVouchTransaction(
          publicKey,
          creatorPubkey,
          photoRecordPDA,
          amountLamports,
          blockhash
        );

        const slot = await connection.getSlot();
        const txSignature = await signAndSendTransaction(tx, slot);

        await connection.confirmTransaction(
          {
            signature: txSignature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        // Record vouch in Supabase
        await supabase.from("vouches").insert({
          photo_id: photoId,
          voucher_wallet: walletAddress,
          amount_lamports: amountLamports,
          tx_signature: txSignature,
        });

        // Update photo's vouch count and earnings
        await supabase.rpc("increment_vouch", {
          p_photo_id: photoId,
          p_amount: amountLamports,
        });

        // Invalidate caches so all screens reflect the new vouch
        queryClient.invalidateQueries({ queryKey: ["vouches"] });
        queryClient.invalidateQueries({ queryKey: ["photos"] });

        setLastSuccess({ amount: amountLamports });

        return txSignature;
      } catch (err: any) {
        const msg = err.message || "";
        const isUserCancel =
          msg.includes("sign request declined") ||
          msg.includes("cancelled") ||
          msg.includes("rejected");
        if (!isUserCancel) {
          console.error("Vouch failed:", err);
          setError(msg || "Vouch failed");
        }
        return null;
      } finally {
        setIsVouching(false);
      }
    },
    [connection, publicKey, walletAddress, signAndSendTransaction]
  );

  return {
    vouch,
    isVouching,
    error,
    clearError: () => setError(null),
    defaultAmount: DEFAULT_VOUCH_LAMPORTS,
    lastSuccess,
    clearSuccess: () => setLastSuccess(null),
  };
}
