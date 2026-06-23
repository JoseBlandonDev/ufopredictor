import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WompiCheckoutButton } from "./wompi-checkout-button";

describe("WompiCheckoutButton", () => {
  it("uses the final public spanish purchase label", () => {
    const html = renderToStaticMarkup(<WompiCheckoutButton />);

    expect(html).toContain("Comprar Pase Mundial 2026");
    expect(html).not.toContain("Comprar World Cup Pass");
  });
});
