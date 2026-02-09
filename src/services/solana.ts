import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Devnet for development
export const CLUSTER = "devnet" as const;
export const ENDPOINT = clusterApiUrl(CLUSTER);

// TODO: Replace with your deployed program ID from Solana Playground
export const PROGRAM_ID = new PublicKey(
  "HDvUruses5D2tPCUZnhkLiR4GB2B49GwkpjJJUKjCAvw"
);

export function getConnection(): Connection {
  return new Connection(ENDPOINT, "confirmed");
}

export function getPhotoRecordPDA(
  creator: PublicKey,
  imageHash: Buffer
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("photo"), creator.toBuffer(), imageHash],
    PROGRAM_ID
  );
}

export function getVouchRecordPDA(
  voucher: PublicKey,
  photoRecord: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vouch"), voucher.toBuffer(), photoRecord.toBuffer()],
    PROGRAM_ID
  );
}

export function getExplorerUrl(
  signature: string,
  cluster: string = CLUSTER
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function getExplorerAddressUrl(
  address: string,
  cluster: string = CLUSTER
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
