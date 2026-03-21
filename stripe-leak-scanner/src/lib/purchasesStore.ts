export type PurchaseRecord = {
  sessionId: string;
  customerEmail: string | null;
  priceId: string;
  amount: number;
  createdAt: number;
};

const purchases = new Map<string, PurchaseRecord>();

export function savePurchase(record: PurchaseRecord) {
  purchases.set(record.sessionId, record);
}

export function getPurchase(sessionId: string) {
  return purchases.get(sessionId);
}

export function hasPurchase(sessionId: string) {
  return purchases.has(sessionId);
}

