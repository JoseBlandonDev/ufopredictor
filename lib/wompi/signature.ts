import { createHash, timingSafeEqual } from "node:crypto";

export type CheckoutSignatureInput = {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
  expirationTime?: string | null;
};

export type WompiEventSignaturePayload = {
  data?: unknown;
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  timestamp?: number | string;
};

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateCheckoutIntegritySignature(input: CheckoutSignatureInput) {
  const expirationTime = input.expirationTime ?? "";
  const payload = `${input.reference}${input.amountInCents}${input.currency}${expirationTime}${input.integritySecret}`;
  return sha256Hex(payload);
}

function getNestedEventValue(root: unknown, propertyPath: string) {
  const parts = propertyPath.split(".");
  let current: unknown = root;

  for (const part of parts) {
    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !(part in current)
    ) {
      throw new Error(`Missing Wompi event signature property: ${propertyPath}`);
    }

    current = (current as Record<string, unknown>)[part];
  }

  if (current === null || current === undefined) {
    return "";
  }

  return String(current);
}

export function generateEventChecksum(event: WompiEventSignaturePayload, eventsSecret: string) {
  if (!event.signature?.properties || !Array.isArray(event.signature.properties)) {
    throw new Error("Wompi event signature properties are required.");
  }

  if (event.timestamp === null || event.timestamp === undefined || event.timestamp === "") {
    throw new Error("Wompi event timestamp is required.");
  }

  const values = event.signature.properties
    .map((property) => getNestedEventValue(event.data, property))
    .join("");

  return sha256Hex(`${values}${event.timestamp}${eventsSecret}`).toUpperCase();
}

function safeEqualChecksum(a: string, b: string) {
  const normalizedA = Buffer.from(a.toUpperCase());
  const normalizedB = Buffer.from(b.toUpperCase());

  return (
    normalizedA.length === normalizedB.length &&
    timingSafeEqual(normalizedA, normalizedB)
  );
}

export function verifyEventChecksum(args: {
  event: WompiEventSignaturePayload;
  eventsSecret: string;
  headerChecksum?: string | null;
}) {
  const bodyChecksum = args.event.signature?.checksum;

  if (!bodyChecksum) {
    return false;
  }

  if (args.headerChecksum && !safeEqualChecksum(args.headerChecksum, bodyChecksum)) {
    return false;
  }

  const expected = generateEventChecksum(args.event, args.eventsSecret);
  return safeEqualChecksum(expected, bodyChecksum);
}
