import { deleteCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import dotenv from "dotenv";
import { candyMachineSigner, umi } from "./base";

dotenv.config();

async function withdrawRent() {
  try {
    // 렌트 출금 트랜잭션 실행
    await deleteCandyMachine(umi, {
      candyMachine: candyMachineSigner.publicKey,
    }).sendAndConfirm(umi);

    console.log("렌트 출금이 완료되었습니다.");
  } catch (error) {
    console.error("렌트 출금 중 오류가 발생했습니다:", error);
  }
}

withdrawRent();
