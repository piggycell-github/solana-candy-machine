import { create } from "@metaplex-foundation/mpl-candy-machine";
import {
  createNft,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { percentAmount, publicKey, sol, some } from "@metaplex-foundation/umi";
import { candyMachineSigner, mintSigner, ownerSigner, umi } from "./base";
import { uploadCandyMachineItems } from "./uploadItems";

// dotenv
import dotenv from "dotenv";
dotenv.config();

// SOL 잔액을 포맷팅하는 함수 (identifier 제거)
function formatSolBalance(basisPoints: number | bigint): string {
  return `${Number(basisPoints) / 10 ** 9} SOL`;
}

async function main() {
  const solPaymentDestination = process.env.SOL_PAYMENT_DESTINATION;
  const collectionUri = process.env.COLLECTION_URI;
  const collectionName = process.env.COLLECTION_NAME;
  const collectionSymbol = process.env.COLLECTION_SYMBOL;
  const collectionSellerFeeBasisPoints =
    process.env.COLLECTION_SELLER_FEE_BASIS_POINTS;
  const solPaymentAmount = process.env.SOL_PAYMENT_AMOUNT;
  const mintLimitPerAddress = process.env.MINT_LIMIT_PER_ADDRESS;
  const collectionCreatorAddress = process.env.COLLECTION_CREATOR_ADDRESS;
  const mintingAmount = process.env.MINTING_AMOUNT;

  if (
    !solPaymentDestination ||
    !collectionUri ||
    !collectionName ||
    !collectionSymbol ||
    !collectionSellerFeeBasisPoints ||
    !collectionCreatorAddress ||
    !solPaymentAmount ||
    !mintLimitPerAddress ||
    !mintingAmount
  ) {
    throw new Error(
      "SOL_PAYMENT_DESTINATION or COLLECTION_URI or COLLECTION_NAME or COLLECTION_SYMBOL or COLLECTION_SELLER_FEE_BASIS_POINTS or SOL_PAYMENT_AMOUNT or MINT_LIMIT_PER_ADDRESS or COLLECTION_CREATOR_ADDRESS or MINTING_AMOUNT is not set"
    );
  }

  console.log("\n=================");
  console.log("[mintSigner]", mintSigner.publicKey);
  console.log("[candyMachineSigner]", candyMachineSigner.publicKey);
  console.log("[ownerSigner]", ownerSigner.publicKey);
  console.log("=================\n");

  const beforeSolBalance = await umi.rpc.getBalance(umi.identity.publicKey);

  console.log(
    "[BEFORE SOL BALANCE]",
    formatSolBalance(beforeSolBalance.basisPoints)
  );

  await createNft(umi, {
    mint: mintSigner,
    authority: umi.identity,
    name: collectionName,
    symbol: collectionSymbol,
    uri: collectionUri,
    sellerFeeBasisPoints: percentAmount(
      Number(collectionSellerFeeBasisPoints),
      2
    ),
    isCollection: true,
  }).sendAndConfirm(umi, { send: { commitment: "finalized" } });

  console.log("[MINTED]", mintSigner.publicKey);

  const instruction = await create(umi, {
    candyMachine: candyMachineSigner,
    collectionMint: mintSigner.publicKey,
    collectionUpdateAuthority: umi.identity,
    tokenStandard: TokenStandard.NonFungible,
    sellerFeeBasisPoints: percentAmount(10, 2),
    itemsAvailable: Number(mintingAmount),
    creators: [
      {
        address: publicKey(collectionCreatorAddress),
        verified: true,
        percentageShare: 100,
      },
    ],
    guards: {
      solPayment: some({
        lamports: sol(Number(solPaymentAmount)),
        destination: publicKey(solPaymentDestination),
      }),
      mintLimit: some({
        id: 1,
        limit: Number(mintLimitPerAddress),
      }),
    },
    configLineSettings: some({
      prefixName: "",
      nameLength: 32,
      prefixUri: "",
      uriLength: 200,
      isSequential: false,
    }),
  });

  await instruction.sendAndConfirm(umi, {
    send: { commitment: "finalized" },
  });

  console.log("[CANDY MACHINE CREATED]", candyMachineSigner.publicKey);

  let offset = 0;

  while (offset < Number(mintingAmount)) {
    await uploadCandyMachineItems(candyMachineSigner.publicKey, offset);
    offset += 10;
  }

  const afterSolBalance = await umi.rpc.getBalance(umi.identity.publicKey);

  console.log(
    "[AFTER SOL BALANCE]",
    formatSolBalance(afterSolBalance.basisPoints)
  );

  console.log(
    "[SOL BALANCE DIFF]",
    formatSolBalance(beforeSolBalance.basisPoints - afterSolBalance.basisPoints)
  );
}

main();
