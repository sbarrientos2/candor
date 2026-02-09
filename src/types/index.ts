import { PublicKey } from "@solana/web3.js";

export interface User {
  id: string;
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  creator_id: string;
  creator_wallet: string;
  image_url: string;
  image_hash: string;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  verification_tx: string | null;
  vouch_count: number;
  total_earned_lamports: number;
  created_at: string;
  // Joined from users table
  creator?: User;
}

export interface Vouch {
  id: string;
  photo_id: string;
  voucher_id: string;
  voucher_wallet: string;
  amount_lamports: number;
  tx_signature: string;
  created_at: string;
  // Joined
  voucher?: User;
}

export interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
}

export interface VerificationResult {
  imageHash: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  txSignature: string;
  timestamp: number;
}

export interface PhotoUploadData {
  imageUri: string;
  imageHash: string;
  caption: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  verificationTx: string;
  creatorWallet: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  PhotoDetail: { photoId: string };
  UserProfile: { walletAddress: string };
};

export type TabParamList = {
  Camera: undefined;
  Feed: undefined;
  Profile: undefined;
};

// Anchor program types
export interface PhotoRecordAccount {
  creator: PublicKey;
  imageHash: number[];
  latitude: number;
  longitude: number;
  timestamp: number;
  vouchCount: number;
  totalEarned: number;
  bump: number;
}

export interface VouchRecordAccount {
  voucher: PublicKey;
  photoRecord: PublicKey;
  amount: number;
  timestamp: number;
  bump: number;
}
