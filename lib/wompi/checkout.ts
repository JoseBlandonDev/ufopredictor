import "server-only";

import { randomBytes } from "node:crypto";
import { buildAppUrl } from "../auth/app-url";
import {
  WOMPI_WORLD_CUP_PASS_PLAN_SLUG,
  WOMPI_WORLD_CUP_PASS_RESOURCE_ID,
  type WompiServerConfig,
} from "./config";
import { generateCheckoutIntegritySignature } from "./signature";

export type WompiCheckoutPayload = {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  expirationTime: string;
  integritySignature: string;
  checkoutUrl: string;
};

export function amountCopToWompiAmountInCents(amountCop: number) {
  return amountCop * 100;
}

export function generateWompiReference(now = new Date()) {
  const timestamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = randomBytes(6).toString("hex");
  return `ufo_wc_${timestamp}_${suffix}`;
}

export function buildWorldCupPassEntitlementMapping() {
  return {
    plan_slug: WOMPI_WORLD_CUP_PASS_PLAN_SLUG,
    grant_type: "competition_access",
    resource_type: "competition",
    resource_id: WOMPI_WORLD_CUP_PASS_RESOURCE_ID,
  } as const;
}

export function buildWompiCheckoutPayload(args: {
  config: WompiServerConfig;
  reference: string;
  amountInCents?: number;
  expirationTime: string;
}) {
  const amountInCents =
    args.amountInCents ?? amountCopToWompiAmountInCents(args.config.worldCupPassAmountCop);
  const redirectUrl = buildAppUrl("/payments/wompi/return", args.config.appUrl).toString();
  const integritySignature = generateCheckoutIntegritySignature({
    reference: args.reference,
    amountInCents,
    currency: args.config.currency,
    expirationTime: args.expirationTime,
    integritySecret: args.config.integritySecret,
  });
  const checkoutUrl = new URL("https://checkout.wompi.co/p/");

  checkoutUrl.searchParams.set("public-key", args.config.publicKey);
  checkoutUrl.searchParams.set("currency", args.config.currency);
  checkoutUrl.searchParams.set("amount-in-cents", String(amountInCents));
  checkoutUrl.searchParams.set("reference", args.reference);
  checkoutUrl.searchParams.set("signature:integrity", integritySignature);
  checkoutUrl.searchParams.set("redirect-url", redirectUrl);
  checkoutUrl.searchParams.set("expiration-time", args.expirationTime);

  return {
    publicKey: args.config.publicKey,
    currency: args.config.currency,
    amountInCents,
    reference: args.reference,
    redirectUrl,
    expirationTime: args.expirationTime,
    integritySignature,
    checkoutUrl: checkoutUrl.toString(),
  } satisfies WompiCheckoutPayload;
}
