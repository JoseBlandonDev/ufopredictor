export type WompiNormalizedStatus = "APPROVED" | "DECLINED" | "PENDING" | "ERROR";

export type WompiTransactionPayload = {
  id: string;
  amount_in_cents: number;
  reference: string;
  currency: string;
  status: string;
};

export type WompiTransactionEvent = {
  event: string;
  data: {
    transaction: WompiTransactionPayload;
  };
  environment?: string;
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at?: string;
};

export function normalizeWompiStatus(status: string): WompiNormalizedStatus {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "APPROVED";
    case "DECLINED":
      return "DECLINED";
    case "PENDING":
      return "PENDING";
    default:
      return "ERROR";
  }
}

export function normalizeWorldCupResourceId(resourceId: string) {
  return resourceId === "world-cup-2026" ? "world_cup_2026" : resourceId;
}

export function parseWompiTransactionEvent(rawEvent: unknown): WompiTransactionEvent {
  if (rawEvent === null || typeof rawEvent !== "object" || Array.isArray(rawEvent)) {
    throw new Error("Wompi event body must be a JSON object.");
  }

  const event = rawEvent as WompiTransactionEvent;
  const transaction = event.data?.transaction;

  if (!event.event || !event.signature?.checksum || !Array.isArray(event.signature.properties)) {
    throw new Error("Wompi event signature fields are missing.");
  }

  if (
    !transaction?.id ||
    !transaction.reference ||
    !transaction.currency ||
    typeof transaction.amount_in_cents !== "number" ||
    !transaction.status
  ) {
    throw new Error("Wompi transaction fields are missing.");
  }

  return event;
}
