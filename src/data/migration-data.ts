export type Difficulty = "easy" | "medium" | "hard";
export type Impact = "low" | "medium" | "high";

export interface MigrationAnalysis {
  euAlternative: string;   // TOOLS slug
  category: string;
  difficulty: Difficulty;
  impact: Impact;
  timeEstimate: string;
  effortScore: number;     // 1–10  (lower = less effort)
  impactScore: number;     // 1–10  (higher = bigger win)
  description: string;
  highlights: string[];    // 2–3 key selling points
}

// priority = impactScore - effortScore (higher → do first)
export const MIGRATION_ANALYSIS: Record<string, MigrationAnalysis> = {
  slack: {
    euAlternative: "mattermost",
    category: "Communication",
    difficulty: "easy",
    impact: "high",
    timeEstimate: "2–5 days",
    effortScore: 2,
    impactScore: 9,
    description:
      "Channel history exports cleanly. Users adapt quickly due to familiar UX. Self-hosted on a €20/month VPS.",
    highlights: [
      "Full message history export",
      "Near-identical channel experience",
      "Self-hosted for full data sovereignty",
    ],
  },
  zoom: {
    euAlternative: "jitsi",
    category: "Video Calls",
    difficulty: "easy",
    impact: "medium",
    timeEstimate: "1 day",
    effortScore: 1,
    impactScore: 7,
    description:
      "No account needed. Works in-browser with zero install. Host your own instance on any EU server.",
    highlights: [
      "Zero-install browser experience",
      "No user accounts required",
      "GDPR-compliant by design",
    ],
  },
  mailchimp: {
    euAlternative: "brevo",
    category: "Email Marketing",
    difficulty: "easy",
    impact: "high",
    timeEstimate: "3–7 days",
    effortScore: 3,
    impactScore: 8,
    description:
      "Contacts, segments, and basic automations import cleanly. Complex branching workflows need rebuilding.",
    highlights: [
      "Data stored in Frankfurt & Paris",
      "GDPR consent management built-in",
      "Seamless contact & segment import",
    ],
  },
  github: {
    euAlternative: "gitea",
    category: "Development",
    difficulty: "medium",
    impact: "high",
    timeEstimate: "1 week",
    effortScore: 4,
    impactScore: 8,
    description:
      "Repos, issues, PRs, and wikis migrate with the official migration tool. CI/CD pipelines need adapting.",
    highlights: [
      "Repos + issues + PRs migrate cleanly",
      "Lightweight — runs on 1 vCPU",
      "Compatible with existing git workflows",
    ],
  },
  asana: {
    euAlternative: "plane",
    category: "Project Management",
    difficulty: "medium",
    impact: "medium",
    timeEstimate: "1–2 weeks",
    effortScore: 4,
    impactScore: 7,
    description:
      "Task structure and project hierarchy export well. Custom automations and integrations vary by complexity.",
    highlights: [
      "Kanban, sprints, and backlogs",
      "Open-source, self-host or cloud",
      "CSV import for tasks & projects",
    ],
  },
  notion: {
    euAlternative: "appflowy",
    category: "Productivity",
    difficulty: "medium",
    impact: "medium",
    timeEstimate: "1–2 weeks",
    effortScore: 5,
    impactScore: 7,
    description:
      "Page structure and basic databases migrate well. Inline formulas and relational DBs may need manual work.",
    highlights: [
      "Works offline — no cloud dependency",
      "Open-source with Rust performance",
      "Databases, docs, and boards",
    ],
  },
  gdrive: {
    euAlternative: "nextcloud",
    category: "Cloud Storage",
    difficulty: "medium",
    impact: "high",
    timeEstimate: "1–2 weeks",
    effortScore: 5,
    impactScore: 9,
    description:
      "File migration is straightforward. Permissions and shared links need recreating. Requires a hosted server.",
    highlights: [
      "Full ownership of files & metadata",
      "100+ integrated apps (Docs, Calendar…)",
      "Verified GDPR-compliant hosting",
    ],
  },
  figma: {
    euAlternative: "penpot",
    category: "Design",
    difficulty: "medium",
    impact: "high",
    timeEstimate: "2–3 weeks",
    effortScore: 6,
    impactScore: 8,
    description:
      "File import is ~95% lossless for standard designs. Complex variables and advanced effects may need fixes.",
    highlights: [
      "SVG-native — no vendor lock-in",
      "~95% Figma import fidelity",
      "Browser-based, self-hostable",
    ],
  },
  hubspot: {
    euAlternative: "twentycrm",
    category: "CRM",
    difficulty: "hard",
    impact: "high",
    timeEstimate: "3–6 weeks",
    effortScore: 8,
    impactScore: 8,
    description:
      "Contact history, pipelines, and deal stages can be mapped. Sequences and complex workflows need expert attention.",
    highlights: [
      "Modern Notion-inspired UI",
      "Full pipeline & contact migration",
      "Expert-assisted migration available",
    ],
  },
  salesforce: {
    euAlternative: "suitecrm",
    category: "CRM",
    difficulty: "hard",
    impact: "high",
    timeEstimate: "4–8 weeks",
    effortScore: 9,
    impactScore: 9,
    description:
      "Complex data models, custom objects, and deep integrations require a certified migration partner. High long-term ROI.",
    highlights: [
      "Enterprise feature parity",
      "Partner-assisted migration recommended",
      "Significant licensing cost reduction",
    ],
  },
};

// Category label for tools not in MIGRATION_ANALYSIS
export const TOOL_CATEGORIES: Record<string, string> = {
  slack: "Communication",
  zoom: "Video Calls",
  mailchimp: "Email Marketing",
  github: "Development",
  asana: "Project Management",
  notion: "Productivity",
  gdrive: "Cloud Storage",
  figma: "Design",
  hubspot: "CRM",
  salesforce: "CRM",
  mattermost: "Communication",
  jitsi: "Video Calls",
  brevo: "Email Marketing",
  gitea: "Development",
  plane: "Project Management",
  appflowy: "Productivity",
  nextcloud: "Cloud Storage",
  penpot: "Design",
  twentycrm: "CRM",
  suitecrm: "CRM",
};
