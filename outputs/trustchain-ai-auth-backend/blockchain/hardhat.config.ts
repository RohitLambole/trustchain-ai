import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    ganache: {
      url: process.env.GANACHE_RPC_URL ?? "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: GANACHE_PRIVATE_KEY ? [GANACHE_PRIVATE_KEY] : undefined
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
