import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { requireAdminMock, getDefaultTorneoExportRangeMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getDefaultTorneoExportRangeMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/torneo-export-queries", async () => {
  return {
    getDefaultTorneoExportRange: getDefaultTorneoExportRangeMock,
  };
});

import TorneoExportPage from "./page";

describe("TorneoExportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getDefaultTorneoExportRangeMock.mockReturnValue({
      from: "2026-06-16",
      to: "2026-06-22",
    });
  });

  it("renders admin export controls and keeps the default download route upcoming-only", async () => {
    const element = await TorneoExportPage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Torneo Mundialista Export");
    expect(html).toContain("type=\"date\"");
    expect(html).toContain("href=\"/admin/torneo-export/download\"");
  });

  it("preserves explicit range values in the download url", async () => {
    const element = await TorneoExportPage({
      searchParams: Promise.resolve({
        from: "2026-06-18",
        to: "2026-06-20",
      }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("/admin/torneo-export/download?from=2026-06-18&amp;to=2026-06-20");
  });
});
