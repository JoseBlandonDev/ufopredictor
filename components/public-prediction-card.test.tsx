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
  collectionMode: "upcoming",
  liveStateLabel: null,
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

    expect(html).toContain("Pase Mundial 2026");
    expect(html).toContain("Ver análisis completo");
  });

  it("keeps registered-free copy for registered viewers without premium access", () => {
    const html = renderToStaticMarkup(<PublicPredictionCard prediction={registeredPrediction} />);

    expect(html).toContain("Incluye contexto completo de confianza y riesgo.");
    expect(html).toContain("Ver detalle público");
  });

  it("prioritizes the stadium over the city when both are present", () => {
    const html = renderToStaticMarkup(<PublicPredictionCard prediction={registeredPrediction} />);

    expect(html).toContain("Azteca, Mexico City");
  });

  it("renders the live disclaimer and friendly state label when requested", () => {
    const html = renderToStaticMarkup(
      <PublicPredictionCard
        prediction={{
          ...registeredPrediction,
          status: "live",
          collectionMode: "live_or_interrupted",
          liveStateLabel: "En vivo",
        }}
        showLiveState
        showPreMatchDisclaimer
      />,
    );

    expect(html).toContain("En vivo");
    expect(html).toContain(
      "Esta predicción fue publicada antes del inicio del partido y no se actualiza en vivo.",
    );
  });

  it("renders awaiting-update labels without inventing a final result", () => {
    const html = renderToStaticMarkup(
      <PublicPredictionCard
        prediction={{
          ...registeredPrediction,
          status: "live",
          collectionMode: "awaiting_result_update",
          liveStateLabel: "Esperando resultado oficial",
        }}
        showLiveState
      />,
    );

    expect(html).toContain("Esperando resultado oficial");
    expect(html).not.toContain("Resultado final verificado");
  });

  it("shows a bounded preview CTA for anonymous preview cards", () => {
    const html = renderToStaticMarkup(
      <PublicPredictionCard
        prediction={{ ...registeredPrediction, viewer: "anonymous" }}
        detailMode="preview"
      />,
    );

    expect(html).toContain("Vista previa limitada");
    expect(html).toContain("Crear cuenta para ver más");
  });
});
