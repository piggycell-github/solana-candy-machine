import { safeFetchCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { candyMachineSigner, umi } from "./base";

export const main = async () => {
  const candyMachine = await safeFetchCandyMachine(
    umi,
    candyMachineSigner.publicKey
  );

  if (!candyMachine) {
    throw new Error("Candy machine not found");
  }

  const mintedNftList = candyMachine.items.filter((item) => item.minted);
  const remainNftList = candyMachine.items.filter((item) => !item.minted);

  /**
     * candyMachine.items type
      {
          index: number,
          minted: boolean,
          name: string,
          uri: string
      },
     */
  console.log(mintedNftList);
  console.log(remainNftList.length);
};

main();
