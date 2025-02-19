import {
  fetchCandyMachine,
  getMerkleProof,
  getMerkleRoot,
  route,
  safeFetchAllowListProofFromSeeds,
} from "@metaplex-foundation/mpl-candy-machine";
import fs from "fs";
import bs58 from "bs58";
import { candyMachineSigner, umi } from "./base";
import { publicKey } from "@metaplex-foundation/umi";

export const main = async () => {
  const allowList = JSON.parse(fs.readFileSync("allowList.json", "utf8"));

  const merkleRoot = getMerkleRoot(allowList);
  const bs58MerkleRoot = bs58.encode(merkleRoot);
  const merkleProof = getMerkleProof(allowList, bs58MerkleRoot);

  console.log("[BS58 MERKLE ROOT]", bs58MerkleRoot);

  const candyMachine = await fetchCandyMachine(
    umi,
    candyMachineSigner.publicKey
  );

  const allowListProof = await safeFetchAllowListProofFromSeeds(umi, {
    candyGuard: candyMachine.mintAuthority,
    candyMachine: candyMachine.publicKey,
    merkleRoot: getMerkleRoot(allowList),
    user: publicKey(umi.identity),
  });

  console.log("[ALLOW LIST PROOF]", allowListProof);

  if (allowListProof !== null) {
    console.log("[ALLOW LIST PROOF IS NOT NULL]");
    return;
  }
};

main();
