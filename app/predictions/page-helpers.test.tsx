import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/public-prediction-card", () => ({
  PublicPredictionCard: () => <div>PUBLIC_PREDICTION_CARD</div>,
}));

vi.mock("@/lib/permissions/current-premium-access", () => ({
  hasCurrentPremiumAccess: vi.fn(),
}));

vi.mock("@/lib/supabase/entitlement-queries", () => ({
  getViewerEntitlementSummary: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { renderPremiumUpgradeModule } from "./page-helpers";

describe("renderPremiumUpgradeModule", () => {
  it("uses football-first teaser language without betting-style premium labels", () => {
    const html = renderToStaticMarkup(renderPremiumUpgradeModule());

    expect(html).toContain("probabilidad de que anoten ambos equipos");
    expect(html).toContain("proyección del total de goles");
    expect(html).not.toContain("Ambos equipos marcan");
    expect(html).not.toContain("Más/Menos de 2,5");
  });
});
