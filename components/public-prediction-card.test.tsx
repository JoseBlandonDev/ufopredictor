import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicPredictionCard } from "./public-prediction-card";
import type { PublicPredictionCardView } from "@/lib/supabase/public-prediction-queries";

const registeredPrediction: PublicPredictionCardView = {
  viewer: "registered_free",
  predictionCreatedAt: "2026-06-19T00:00:00.000Z",
  matchSlug: "world-cup-2026-mexico-vs-south-africa-2026-06-11",
  kickoffAt: "2026-06-11T19:00:00.000Z",
  stage: "Group stage",
  status: "scheduled",
  competitionName: "World Cup 2026",
  competitionSlug: "world-cup-2026",
  homeTeamName: "Mexico",
  homeTeamSlug: "mexico",
  homeTeamLogoUrl: null,
  homeTeamFlagUrl: null,
  awayTeamName: "South Africa",
  awayTeamSlug: "south-africa",
  awayTeamLogoUrl: null,
  awayTeamFlagUrl: null,
  venueName: "Azteca",
  venueCity: "Mexico City",
  verifiedResult: null,
  homeWinProb: 42,
  drawProb: 29,
  awayWinProb: 29,
  confidenceScore: 71,
  riskLevel: "medium",
};

describe("PublicPredictionCard", () => {
  it("uses premium copy for registered viewers with active premium access", () => {
    const html = renderToStaticMarkup(
      <PublicPredictionCard prediction={registeredPrediction} premiumAccessActive />,
    );

    expect(html).toContain("Vista premium");
    expect(html).toContain("Ver detalle premium");
    expect(html).not.toContain("Vista registrada gratis");
  });

  it("keeps registered-free copy for registered viewers without premium access", () => {
    const html = renderToStaticMarkup(<PublicPredictionCard prediction={registeredPrediction} />);

    expect(html).toContain("Vista registrada gratis");
    expect(html).toContain("Ver detalle publico");
  });
});
