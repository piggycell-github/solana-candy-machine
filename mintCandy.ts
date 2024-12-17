import {
  fetchCandyGuard,
  fetchCandyMachine,
  mintV2,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { candyMachineSigner, keypairConvert } from "./base";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  fetchDigitalAsset,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createMintWithAssociatedToken,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

// dotenv
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const minterSecretKey = process.env.MINTER_SECRET_KEY;
  const rpcUrl = process.env.RPC_URL;
  const solPaymentDestination = process.env.SOL_PAYMENT_DESTINATION;

  if (!minterSecretKey || !rpcUrl || !solPaymentDestination) {
    throw new Error(
      "MINTER_SECRET_KEY or RPC_URL or SOL_PAYMENT_DESTINATION is not set"
    );
  }

  const keypair = Keypair.fromSecretKey(bs58.decode(minterSecretKey));

  const umi = createUmi(rpcUrl)
    .use(keypairIdentity(keypairConvert(keypair)))
    .use(mplCandyMachine());

  const nftMint = await generateSigner(umi);

  const candyMachine = await fetchCandyMachine(
    umi,
    candyMachineSigner.publicKey
  );

  const collectionNft = await fetchDigitalAsset(
    umi,
    candyMachine.collectionMint
  );

  const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))

    .add(
      createMintWithAssociatedToken(umi, {
        mint: nftMint,
        owner: umi.identity.publicKey,
      })
    )
    .add(
      mintV2(umi, {
        candyMachine: candyMachine.publicKey,
        nftMint: nftMint.publicKey,
        collectionMint: candyMachine.collectionMint,
        collectionUpdateAuthority: collectionNft.metadata.updateAuthority,
        tokenStandard: TokenStandard.NonFungible,
        candyGuard: candyGuard.publicKey,
        mintArgs: {
          solPayment: some({
            destination: publicKey(solPaymentDestination),
          }),
          mintLimit: some({ id: 1 }),
        },
      })
    )
    .sendAndConfirm(umi, { send: { commitment: "finalized" } });

  console.log("[MINTED NFT]", nftMint.publicKey);
}

main();
