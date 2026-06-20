import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
dotenv.config();

import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL ?? process.env.POLYGON_AMOY_RPC_URL ?? "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.POLYGON_AMOY_PRIVATE_KEY;
const networkFlagIndex = process.argv.indexOf("--network");
const selectedNetwork = networkFlagIndex >= 0 ? process.argv[networkFlagIndex + 1] : undefined;

if ((selectedNetwork === "amoy" || selectedNetwork === "polygonAmoy") && (!AMOY_RPC_URL || !DEPLOYER_PRIVATE_KEY)) {
  throw new Error("AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY are required for Polygon Amoy deployments");
}

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
    },
    amoy: {
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : undefined
    },
    polygonAmoy: {
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : undefined
    }
  },
  etherscan: {
    apiKey: {
      amoy: process.env.POLYGONSCAN_API_KEY ?? "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY ?? ""
    },
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
