import { clusterApiUrl } from "@solana/web3.js";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export interface Cluster {
  name: string;
  endpoint: string;
  network: ClusterNetwork;
}

export enum ClusterNetwork {
  Mainnet = "mainnet-beta",
  Testnet = "testnet",
  Devnet = "devnet",
}

export const defaultClusters: Readonly<Cluster[]> = [
  {
    name: "devnet",
    endpoint: clusterApiUrl("devnet"),
    network: ClusterNetwork.Devnet,
  },
];

export interface ClusterProviderContext {
  selectedCluster: Cluster;
  clusters: Cluster[];
  setSelectedCluster: (cluster: Cluster) => void;
  getExplorerUrl(path: string): string;
}

const Context = createContext<ClusterProviderContext>(
  {} as ClusterProviderContext
);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [selectedCluster, setSelectedCluster] = useState<Cluster>(
    defaultClusters[0]
  );

  const value: ClusterProviderContext = useMemo(
    () => ({
      selectedCluster,
      clusters: [...defaultClusters],
      setSelectedCluster,
      getExplorerUrl: (path: string) =>
        `https://explorer.solana.com/${path}?cluster=${selectedCluster.network}`,
    }),
    [selectedCluster]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCluster() {
  return useContext(Context);
}
