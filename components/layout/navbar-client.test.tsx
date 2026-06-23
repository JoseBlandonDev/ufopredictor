import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <div>LOGOUT_BUTTON</div>,
}));

import { NavbarClient } from "./navbar-client";

describe("NavbarClient", () => {
  it("shows Crear cuenta and Ingresar for anonymous users", () => {
    usePathnameMock.mockReturnValue("/predictions");

    const html = renderToStaticMarkup(<NavbarClient isAuthenticated={false} isAdmin={false} />);

    expect(html).toContain("Crear cuenta");
    expect(html).toContain("Ingresar");
    expect(html).not.toContain("Ops");
  });

  it("keeps Ops hidden for non-admin authenticated users", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    const html = renderToStaticMarkup(<NavbarClient isAuthenticated isAdmin={false} />);

    expect(html).toContain("LOGOUT_BUTTON");
    expect(html).not.toContain("Ops");
  });

  it("shows Ops for admin users", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    const html = renderToStaticMarkup(<NavbarClient isAuthenticated isAdmin />);

    expect(html).toContain("Ops");
    expect(html).toContain("Laboratorio de partidos");
  });
});
