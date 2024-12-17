import { addConfigLines } from "@metaplex-foundation/mpl-candy-machine";
import { umi } from "./base";
import { publicKey } from "@metaplex-foundation/umi";

export async function uploadCandyMachineItems(
  candyMachineAddress: string,
  offset = 0
) {
  const configLines = Array.from({ length: 10 }, (_, i) => ({
    name: `Item #${i + 1}`,
    uri: `${i + 1}.json`,
  }));

  const instruction = await addConfigLines(umi, {
    candyMachine: publicKey(candyMachineAddress),
    index: offset,
    configLines,
  });

  await instruction.sendAndConfirm(umi, {
    send: { commitment: "finalized" },
  });

  console.log(
    `[ITEMS UPLOADED]
    ㄴ candyMachine: ${candyMachineAddress}
    ㄴ offset: ${offset}
    ㄴ length: ${configLines.length}`
  );
}
