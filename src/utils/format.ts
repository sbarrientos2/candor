import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function formatSOL(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  if (sol < 0.001) return `${sol.toFixed(6)} SOL`;
  if (sol < 1) return `${sol.toFixed(4)} SOL`;
  return `${sol.toFixed(2)} SOL`;
}

export function formatUSD(lamports: number, solPrice: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  const usd = sol * solPrice;
  return `$${usd.toFixed(2)}`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function lamportsToSOL(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}
