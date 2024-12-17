import {
  fetchCandyMachine,
  mplCandyMachine,
  safeFetchMintCounterFromSeeds,
} from "@metaplex-foundation/mpl-candy-machine";
import { candyMachineSigner, keypairConvert } from "./base";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  const minterSecretKey = process.env.MINTER_SECRET_KEY;
  const rpcUrl = process.env.RPC_URL;

  if (!minterSecretKey || !rpcUrl) {
    throw new Error("MINTER_SECRET_KEY or RPC_URL is not set");
  }

  const keypair = Keypair.fromSecretKey(bs58.decode(minterSecretKey));

  const umi = createUmi(rpcUrl)
    .use(keypairIdentity(keypairConvert(keypair)))
    .use(mplCandyMachine());

  const candyMachine = await fetchCandyMachine(
    umi,
    candyMachineSigner.publicKey
  );

  const mintCounter = await safeFetchMintCounterFromSeeds(umi, {
    id: 1,
    user: umi.identity.publicKey,
    candyMachine: candyMachine.publicKey,
    candyGuard: candyMachine.mintAuthority,
  });

  console.log(mintCounter);
}

main();
