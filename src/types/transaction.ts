export enum TransactionCategory {
  NFT_COLLECTION_CREATE = "NFT_COLLECTION_CREATE",
  CANDY_MACHINE_CREATE = "CANDY_MACHINE_CREATE",
  METADATA_UPLOAD = "METADATA_UPLOAD",
}

export interface TransactionData {
  timestamp: string;
  category: TransactionCategory;
  transaction_hash: string;
  amount_sol: number;
  status: "SUCCESS";
}
