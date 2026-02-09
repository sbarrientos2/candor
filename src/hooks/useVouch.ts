import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "../utils/ConnectionProvider";
import { useWallet } from "./useWallet";
import { buildVouchTransaction } from "../services/anchor";
import { getPhotoRecordPDA } from "../services/solana";
import { supabase } from "../services/supabase";
import { hashToBytes } from "../utils/crypto";

const DEFAULT_VOUCH_LAMPORTS = 5_000_000; // 0.005 SOL

export function useVouch() {
  const { connection } = useConnection();
  const { publicKey, walletAddress, signAndSendTransaction } = useWallet();
  const [isVouching, setIsVouching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        return txSignature;
      } catch (err: any) {
        console.error("Vouch failed:", err);
        setError(err.message || "Vouch failed");
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
  };
}
