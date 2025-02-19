// SOL 잔액을 포맷팅하는 함수 (identifier 제거)
export function formatSolBalance(basisPoints: number | bigint): string {
  return `${Number(basisPoints) / 10 ** 9} SOL`;
}

// 실행 시간을 초 단위로 계산하는 함수
export function getRunningTimeToSeconds(startTime: number): string {
  return `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
}

// 환경 변수 유효성 검사 함수
export function validateEnvironmentVariables() {
  const requiredEnvVars = [
    "SOL_PAYMENT_DESTINATION",
    "COLLECTION_URI",
    "COLLECTION_NAME",
    "COLLECTION_SYMBOL",
    "COLLECTION_SELLER_FEE_BASIS_POINTS",
    "COLLECTION_CREATOR_ADDRESS",
    "SOL_PAYMENT_AMOUNT",
    "MINT_LIMIT_PER_ADDRESS",
    "MINTING_AMOUNT",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}
