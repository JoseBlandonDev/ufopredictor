export function parseUsdInputToCents(value: FormDataEntryValue | string | null | undefined) {
  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const whole = Number(wholePart);
  const cents = Number((fractionalPart + "00").slice(0, 2));

  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(cents)) {
    return null;
  }

  const total = whole * 100 + cents;
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

export function formatUsdCents(amountUsdCents: number) {
  const wholeDollars = Math.trunc(amountUsdCents / 100);
  const cents = amountUsdCents % 100;

  if (!Number.isSafeInteger(amountUsdCents) || amountUsdCents <= 0) {
    throw new Error("USD cents must be a positive safe integer.");
  }

  if (cents === 0) {
    return `US$${wholeDollars.toLocaleString("en-US")}`;
  }

  return `US$${wholeDollars.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
}

export function convertUsdCentsToCop(amountUsdCents: number, usdCopRate: number) {
  if (!Number.isSafeInteger(amountUsdCents) || amountUsdCents <= 0) {
    throw new Error("USD cents must be a positive safe integer.");
  }

  if (!Number.isFinite(usdCopRate) || usdCopRate <= 0) {
    throw new Error("USD/COP rate must be finite and positive.");
  }

  // Round to the nearest whole COP peso. Positive .5 values round up.
  return Math.round((amountUsdCents * usdCopRate) / 100);
}

export function amountCopToWompiAmountInCents(amountCop: number) {
  if (!Number.isSafeInteger(amountCop) || amountCop <= 0) {
    throw new Error("COP amount must be a positive safe integer.");
  }

  return amountCop * 100;
}

export function formatCopAmount(amountCop: number) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amountCop);
}

export function formatCopDisplay(amountCop: number) {
  return `COP ${formatCopAmount(amountCop)}`;
}

export function formatUsdInputValue(amountUsdCents: number | null) {
  if (!amountUsdCents) {
    return "";
  }

  return (amountUsdCents / 100).toFixed(2);
}
