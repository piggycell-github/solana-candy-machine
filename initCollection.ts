import {
  createNft,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { percentAmount } from "@metaplex-foundation/umi";
import { mintSigner, umi } from "./base";
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

  const collectionUri = process.env.COLLECTION_URI!;
  const collectionName = process.env.COLLECTION_NAME!;
  const collectionSymbol = process.env.COLLECTION_SYMBOL!;
  const collectionSellerFeeBasisPoints =
    process.env.COLLECTION_SELLER_FEE_BASIS_POINTS!;

  console.log("\n=================");
  console.log("[mintSigner]", mintSigner.publicKey);
  console.log("=================\n");

  const beforeSolBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const startTime = Date.now();

  console.log(
    "[BEFORE SOL BALANCE]",
    formatSolBalance(beforeSolBalance.basisPoints)
  );

  const nftCollectionTx = await createNft(umi, {
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
  }).sendAndConfirm(umi, { send: { commitment: "confirmed" } });

  await logger.logTransaction({
    timestamp: new Date().toISOString(),
    category: TransactionCategory.NFT_COLLECTION_CREATE,
    transaction_hash: bs58.encode(nftCollectionTx.signature),
    amount_sol:
      Number(
        beforeSolBalance.basisPoints -
          (
            await umi.rpc.getBalance(umi.identity.publicKey)
          ).basisPoints
      ) / 1e9,
    status: "SUCCESS",
  });

  console.log("[MINTED]", mintSigner.publicKey);
  console.log("[MINTING TIME]", getRunningTimeToSeconds(startTime));

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
