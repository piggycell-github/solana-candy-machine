import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import {
  createSignerFromKeypair,
  publicKey,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

// dotenv
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.PAYER_SECRET_KEY;
const rpcUrl = process.env.RPC_URL;

if (!secretKey || !rpcUrl) {
  throw new Error("PAYER_SECRET_KEY or RPC_URL is not set");
}
const ownerKeypair = Keypair.fromSecretKey(bs58.decode(secretKey));

// load candy-machine.json
const candyMachineKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("keys/candy-machine.json", "utf8")))
);

// load nft-collection.json
const nftCollectionKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(fs.readFileSync("keys/nft-collection.json", "utf8"))
  )
);

export function keypairConvert(keypair: Keypair) {
  return {
    publicKey: publicKey(keypair.publicKey),
    secretKey: keypair.secretKey,
  };
}

// Use the RPC endpoint of your choice.
export const umi = createUmi(rpcUrl)
  .use(keypairIdentity(keypairConvert(ownerKeypair)))
  .use(mplCandyMachine());

export const mintSigner = createSignerFromKeypair(
  umi,
  keypairConvert(nftCollectionKeypair)
);
export const candyMachineSigner = createSignerFromKeypair(
  umi,
  keypairConvert(candyMachineKeypair)
);
export const ownerSigner = createSignerFromKeypair(
  umi,
  keypairConvert(ownerKeypair)
);
