import { create } from "@metaplex-foundation/mpl-candy-machine";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { percentAmount, publicKey, sol, some } from "@metaplex-foundation/umi";
import { candyMachineSigner, mintSigner, umi } from "./base";
import { uploadCandyMachineItems } from "./uploadItems";
import { TransactionLogger } from "./src/utils/TransactionLogger";
import { TransactionCategory } from "./src/types/transaction";
import {
  formatSolBalance,
  getRunningTimeToSeconds,
  validateEnvironmentVariables,
} from "./src/utils/common";
import bs58 from "bs58";

// dotenv
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const logger = TransactionLogger.getInstance();
  validateEnvironmentVariables();

  const solPaymentDestination = process.env.SOL_PAYMENT_DESTINATION!;
  const solPaymentAmount = process.env.SOL_PAYMENT_AMOUNT!;
  const mintLimitPerAddress = process.env.MINT_LIMIT_PER_ADDRESS!;
  const collectionCreatorAddress = process.env.COLLECTION_CREATOR_ADDRESS!;
  const mintingAmount = process.env.MINTING_AMOUNT!;

  console.log("\n=================");
  console.log("[candyMachineSigner]", candyMachineSigner.publicKey);
  console.log("[mintSigner]", mintSigner.publicKey);
  console.log("=================\n");

  const beforeSolBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const startTime = Date.now();

  console.log(
    "[BEFORE SOL BALANCE]",
    formatSolBalance(beforeSolBalance.basisPoints)
  );

  const instruction = await create(umi, {
    candyMachine: candyMachineSigner,
    collectionMint: mintSigner.publicKey,
    collectionUpdateAuthority: umi.identity,
    tokenStandard: TokenStandard.NonFungible,
    sellerFeeBasisPoints: percentAmount(5, 2),
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
      startDate: some({
        date: new Date("2024-02-18T08:00:00Z"),
      }),
      endDate: some({
        date: new Date("2026-01-25T09:00:00Z"),
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

  const candyMachineTx = await instruction.sendAndConfirm(umi, {
    send: { commitment: "confirmed" },
  });

  await logger.logTransaction({
    timestamp: new Date().toISOString(),
    category: TransactionCategory.CANDY_MACHINE_CREATE,
    transaction_hash: bs58.encode(candyMachineTx.signature),
    amount_sol:
      Number(
        beforeSolBalance.basisPoints -
          (
            await umi.rpc.getBalance(umi.identity.publicKey)
          ).basisPoints
      ) / 1e9,
    status: "SUCCESS",
  });

  console.log("[CANDY MACHINE CREATED]", candyMachineSigner.publicKey);
  console.log(
    "[CANDY MACHINE CREATING TIME]",
    getRunningTimeToSeconds(startTime)
  );

  // sleep 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 5000));

  let offset = 0;

  while (offset < Number(mintingAmount)) {
    console.log(
      "Uploading items...",
      offset,
      getRunningTimeToSeconds(startTime)
    );
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
  console.log("[TOTAL TIME]", getRunningTimeToSeconds(startTime));

  await logger.printTotalCosts();
}

main();
