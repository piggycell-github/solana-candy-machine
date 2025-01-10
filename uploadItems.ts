import { addConfigLines } from "@metaplex-foundation/mpl-candy-machine";
import { umi } from "./base";
import { publicKey } from "@metaplex-foundation/umi";

export async function uploadCandyMachineItems(
  candyMachineAddress: string,
  offset = 0
) {
  const baseUrl = process.env.NFT_BASE_URL;
  const baseName = process.env.NFT_BASE_NAME;

  if (!baseUrl || !baseName) {
    throw new Error("NFT_BASE_URL or NFT_BASE_NAME is not set");
  }

  const configLines = Array.from({ length: 10 }, (_, i) => ({
    name: `${baseName} #${offset + i + 1}`,
    uri: `${baseUrl}${offset + i + 1}.json`,
  }));

  const instruction = await addConfigLines(umi, {
    candyMachine: publicKey(candyMachineAddress),
    authority: umi.identity,
    index: offset,
    configLines,
  });

  await instruction.sendAndConfirm(umi, {
    send: { commitment: "confirmed" },
  });

  console.log(
    `[ITEMS UPLOADED]
    ㄴ candyMachine: ${candyMachineAddress}
    ㄴ offset: ${offset}
    ㄴ length: ${configLines.length}`
  );
}
