import type { WorldCup2026Group } from "./types";

export const WORLD_CUP_2026_GROUPS = [
  {
    groupKey: "group-a",
    displayName: "Group A",
    fifaGroupCode: "A",
    teamKeys: ["mexico", "south-africa", "south-korea", "czech-republic"],
  },
  {
    groupKey: "group-b",
    displayName: "Group B",
    fifaGroupCode: "B",
    teamKeys: ["canada", "bosnia-herzegovina", "qatar", "switzerland"],
  },
  {
    groupKey: "group-c",
    displayName: "Group C",
    fifaGroupCode: "C",
    teamKeys: ["brazil", "morocco", "haiti", "scotland"],
  },
  {
    groupKey: "group-d",
    displayName: "Group D",
    fifaGroupCode: "D",
    teamKeys: ["usa", "paraguay", "australia", "turkiye"],
  },
  {
    groupKey: "group-e",
    displayName: "Group E",
    fifaGroupCode: "E",
    teamKeys: ["germany", "curacao", "cote-divoire", "ecuador"],
  },
  {
    groupKey: "group-f",
    displayName: "Group F",
    fifaGroupCode: "F",
    teamKeys: ["netherlands", "japan", "sweden", "tunisia"],
  },
  {
    groupKey: "group-g",
    displayName: "Group G",
    fifaGroupCode: "G",
    teamKeys: ["belgium", "egypt", "iran", "new-zealand"],
  },
  {
    groupKey: "group-h",
    displayName: "Group H",
    fifaGroupCode: "H",
    teamKeys: ["spain", "cabo-verde", "saudi-arabia", "uruguay"],
  },
  {
    groupKey: "group-i",
    displayName: "Group I",
    fifaGroupCode: "I",
    teamKeys: ["france", "senegal", "iraq", "norway"],
  },
  {
    groupKey: "group-j",
    displayName: "Group J",
    fifaGroupCode: "J",
    teamKeys: ["argentina", "algeria", "austria", "jordan"],
  },
  {
    groupKey: "group-k",
    displayName: "Group K",
    fifaGroupCode: "K",
    teamKeys: ["portugal", "congo-dr", "uzbekistan", "colombia"],
  },
  {
    groupKey: "group-l",
    displayName: "Group L",
    fifaGroupCode: "L",
    teamKeys: ["england", "croatia", "ghana", "panama"],
  },
] as const satisfies readonly WorldCup2026Group[];
