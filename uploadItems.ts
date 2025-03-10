import { addConfigLines } from "@metaplex-foundation/mpl-candy-machine";
import { umi } from "./base";
import { publicKey } from "@metaplex-foundation/umi";
import { TransactionLogger } from "./src/utils/TransactionLogger";
import { TransactionCategory } from "./src/types/transaction";
import bs58 from "bs58";

export async function uploadCandyMachineItems(
  candyMachineAddress: string,
  offset = 0,
  shift = 0
) {
  const logger = TransactionLogger.getInstance();

  const beforeBalance = await umi.rpc.getBalance(umi.identity.publicKey);
  const baseUrl = process.env.NFT_BASE_URL;
  const baseName = process.env.NFT_BASE_NAME;

  if (!baseUrl || !baseName) {
    throw new Error("NFT_BASE_URL or NFT_BASE_NAME is not set");
  }

  const configLines = Array.from({ length: 10 }, (_, i) => ({
    name: `${baseName} #${offset + i + 1 + shift}`,
    uri: `${baseUrl}${offset + i + 1 + shift}.json`,
  }));

  const instruction = await addConfigLines(umi, {
    candyMachine: publicKey(candyMachineAddress),
    authority: umi.identity,
    index: offset,
    configLines,
  });

  const tx = await instruction.sendAndConfirm(umi, {
    send: { commitment: "confirmed" },
  });

  const afterBalance = await umi.rpc.getBalance(umi.identity.publicKey);

  await logger.logTransaction({
    timestamp: new Date().toISOString(),
    category: TransactionCategory.METADATA_UPLOAD,
    transaction_hash: bs58.encode(tx.signature),
    amount_sol:
      Number(beforeBalance.basisPoints - afterBalance.basisPoints) / 1e9,
    status: "SUCCESS",
  });

  console.log(
    `[ITEMS UPLOADED]
    ㄴ candyMachine: ${candyMachineAddress}
    ㄴ offset: ${offset}
    ㄴ length: ${configLines.length}`
  );
}
