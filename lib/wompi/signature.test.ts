import { describe, expect, it } from "vitest";
import { generateCheckoutIntegritySignature, generateEventChecksum, verifyEventChecksum } from "./signature";

describe("Wompi signatures", () => {
  it("generates the checkout integrity signature with amount_in_cents", () => {
    expect(
      generateCheckoutIntegritySignature({
        reference: "sk8-438k4-xmxm392-sn2m",
        amountInCents: 2490000,
        currency: "COP",
        integritySecret: "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6",
      }),
    ).toBe("37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5");
  });

  it("validates Wompi event checksums from dynamic signature properties", () => {
    const event = {
      event: "transaction.updated",
      data: {
        transaction: {
          id: "1234-1610641025-49201",
          status: "APPROVED",
          amount_in_cents: 4490000,
        },
      },
      signature: {
        properties: [
          "transaction.id",
          "transaction.status",
          "transaction.amount_in_cents",
        ],
        checksum: "5A18EC5E8FDB7DF463E9F94774CBA8F583BA21BD04A09CEFF2EA68A4BC0AEFBE",
      },
      timestamp: 1530291411,
    };

    expect(generateEventChecksum(event, "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z")).toBe(
      event.signature.checksum,
    );
    expect(
      verifyEventChecksum({
        event,
        eventsSecret: "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z",
        headerChecksum: event.signature.checksum,
      }),
    ).toBe(true);
  });

  it("rejects invalid event checksums", () => {
    const event = {
      data: { transaction: { id: "tx", status: "APPROVED", amount_in_cents: 8700000 } },
      signature: {
        properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
        checksum: "BAD",
      },
      timestamp: 1530291411,
    };

    expect(
      verifyEventChecksum({
        event,
        eventsSecret: "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z",
      }),
    ).toBe(false);
  });
});
