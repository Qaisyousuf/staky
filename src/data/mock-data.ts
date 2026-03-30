// ─── Tool definitions ─────────────────────────────────────────────────────────

export interface Tool {
  slug: string;
  name: string;
  color: string; // hex for icon badge background
  abbr: string;  // 2-letter abbreviation
  origin: "us" | "eu";
  country?: string; // EU tools only
}

export const TOOLS: Record<string, Tool> = {
  // US tools
  slack:        { slug: "slack",        name: "Slack",        color: "#611F69", abbr: "Sl", origin: "us" },
  notion:       { slug: "notion",       name: "Notion",       color: "#191919", abbr: "No", origin: "us" },
  figma:        { slug: "figma",        name: "Figma",        color: "#F24E1E", abbr: "Fi", origin: "us" },
  gdrive:       { slug: "gdrive",       name: "Google Drive", color: "#1A73E8", abbr: "GD", origin: "us" },
  zoom:         { slug: "zoom",         name: "Zoom",         color: "#2D8CFF", abbr: "Zm", origin: "us" },
  github:       { slug: "github",       name: "GitHub",       color: "#24292E", abbr: "Gh", origin: "us" },
  salesforce:   { slug: "salesforce",   name: "Salesforce",   color: "#00A1E0", abbr: "SF", origin: "us" },
  mailchimp:    { slug: "mailchimp",    name: "Mailchimp",    color: "#FFE01B", abbr: "Mc", origin: "us" },
  asana:        { slug: "asana",        name: "Asana",        color: "#F06A6A", abbr: "As", origin: "us" },
  hubspot:      { slug: "hubspot",      name: "HubSpot",      color: "#FF7A59", abbr: "Hs", origin: "us" },
  // EU tools
  mattermost:   { slug: "mattermost",   name: "Mattermost",   color: "#1A5EAD", abbr: "Mm", origin: "eu", country: "🇺🇸→🇩🇪" },
  appflowy:     { slug: "appflowy",     name: "AppFlowy",     color: "#00BCF0", abbr: "AF", origin: "eu", country: "🇩🇪" },
  penpot:       { slug: "penpot",       name: "Penpot",       color: "#7238F5", abbr: "Pp", origin: "eu", country: "🇪🇸" },
  nextcloud:    { slug: "nextcloud",    name: "Nextcloud",    color: "#0082C9", abbr: "Nc", origin: "eu", country: "🇩🇪" },
  jitsi:        { slug: "jitsi",        name: "Jitsi Meet",   color: "#0769BC", abbr: "Ji", origin: "eu", country: "🇫🇷" },
  gitea:        { slug: "gitea",        name: "Gitea",        color: "#609926", abbr: "Gt", origin: "eu", country: "🇩🇪" },
  suitecrm:     { slug: "suitecrm",     name: "SuiteCRM",     color: "#5A2D82", abbr: "SC", origin: "eu", country: "🇬🇧" },
  brevo:        { slug: "brevo",        name: "Brevo",        color: "#0A2C6E", abbr: "Br", origin: "eu", country: "🇫🇷" },
  plane:        { slug: "plane",        name: "Plane",        color: "#2563EB", abbr: "Pl", origin: "eu", country: "🇩🇪" },
  twentycrm:    { slug: "twentycrm",    name: "Twenty CRM",   color: "#1F1F1F", abbr: "Tw", origin: "eu", country: "🇫🇷" },
};

// ─── Popular switches (landing + discover) ────────────────────────────────────

export interface Switch {
  id: string;
  from: keyof typeof TOOLS;
  to: keyof typeof TOOLS;
  category: string;
  switcherCount: number;
  description: string;
  euCountry: string;
  license: string;
  rating: number;
}

export const POPULAR_SWITCHES: Switch[] = [
  {
    id: "1", from: "slack", to: "mattermost", category: "Communication",
    switcherCount: 1240, rating: 4.6,
    description: "Self-hosted team messaging with channels, threads, and integrations. Full data ownership.",
    euCountry: "Germany", license: "Open Source",
  },
  {
    id: "2", from: "notion", to: "appflowy", category: "Productivity",
    switcherCount: 890, rating: 4.3,
    description: "Collaborative workspace for notes, wikis, and project management. Built in Rust.",
    euCountry: "Germany", license: "Open Source",
  },
  {
    id: "3", from: "figma", to: "penpot", category: "Design",
    switcherCount: 2100, rating: 4.5,
    description: "Open-source design and prototyping tool. Works in-browser with SVG-native format.",
    euCountry: "Spain", license: "Open Source",
  },
  {
    id: "4", from: "gdrive", to: "nextcloud", category: "Cloud Storage",
    switcherCount: 3400, rating: 4.7,
    description: "Self-hosted cloud storage with 100+ apps. GDPR compliant out of the box.",
    euCountry: "Germany", license: "Open Source",
  },
  {
    id: "5", from: "zoom", to: "jitsi", category: "Video Calls",
    switcherCount: 760, rating: 4.2,
    description: "Serverless video calls — no account needed. Host your own or use public servers.",
    euCountry: "France", license: "Open Source",
  },
  {
    id: "6", from: "github", to: "gitea", category: "Development",
    switcherCount: 540, rating: 4.4,
    description: "Lightweight self-hosted Git service. Mirrors GitHub workflows with a tiny footprint.",
    euCountry: "Germany", license: "Open Source",
  },
  {
    id: "7", from: "mailchimp", to: "brevo", category: "Email Marketing",
    switcherCount: 1100, rating: 4.5,
    description: "EU-based email and marketing platform. GDPR-native with servers in Europe.",
    euCountry: "France", license: "SaaS",
  },
  {
    id: "8", from: "asana", to: "plane", category: "Project Management",
    switcherCount: 670, rating: 4.3,
    description: "Open-source project and issue tracking. Self-host or use the cloud version.",
    euCountry: "Germany", license: "Open Source",
  },
  {
    id: "9", from: "salesforce", to: "suitecrm", category: "CRM",
    switcherCount: 320, rating: 4.1,
    description: "Enterprise CRM built on SugarCRM. Full feature parity at a fraction of the cost.",
    euCountry: "UK", license: "Open Source",
  },
  {
    id: "10", from: "hubspot", to: "twentycrm", category: "CRM",
    switcherCount: 280, rating: 4.0,
    description: "Modern open-source CRM with a clean interface inspired by the best of Notion and Linear.",
    euCountry: "France", license: "Open Source",
  },
];

// ─── Categories ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "All",
  "Communication",
  "Productivity",
  "Design",
  "Cloud Storage",
  "Video Calls",
  "Development",
  "Email Marketing",
  "Project Management",
  "CRM",
];

// ─── Authors ───────────────────────────────────────────────────────────────────

export interface Author {
  id: string;
  name: string;
  initials: string;
  color: string;
  title: string;
  company: string;
  verified: boolean;
  isPartner: boolean;
  companyName?: string;
  rating?: number;
  projects?: number;
}

export const AUTHORS: Record<string, Author> = {
  lars: {
    id: "a1", name: "Lars Müller", initials: "LM", color: "#0F6E56",
    title: "CTO", company: "DataFlow AG", verified: false, isPartner: false,
  },
  sofia: {
    id: "a2", name: "Sofia Antonova", initials: "SA", color: "#7238F5",
    title: "Engineering Lead", company: "Kleio Labs", verified: false, isPartner: false,
  },
  techmigrate: {
    id: "a3", name: "TechMigrate GmbH", initials: "TM", color: "#2A5FA5",
    title: "Migration Partner", company: "TechMigrate GmbH", verified: true, isPartner: true,
    companyName: "TechMigrate GmbH", rating: 4.8, projects: 47,
  },
  marie: {
    id: "a4", name: "Marie Dubois", initials: "MD", color: "#F24E1E",
    title: "Product Manager", company: "Vega SAS", verified: false, isPartner: false,
  },
  nordic: {
    id: "a5", name: "Nordic Cloud Solutions", initials: "NC", color: "#2A5FA5",
    title: "Migration Partner", company: "Nordic Cloud Solutions", verified: true, isPartner: true,
    companyName: "Nordic Cloud Solutions", rating: 4.9, projects: 82,
  },
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  author: Author;
  content: string;
  timeAgo: string;
  replies?: Comment[];
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  author: Author;
  from: keyof typeof TOOLS;
  to: keyof typeof TOOLS;
  story: string;
  tags: string[];
  likes: number;
  recommendations: number;
  saves: number;
  timeAgo: string;
  comments: Comment[];
}

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    author: AUTHORS.lars,
    from: "slack", to: "mattermost",
    story:
      "After 3 years on Slack we finally made the switch to Mattermost. The migration took about 2 weeks end-to-end — channel export, user onboarding, and integrations. The self-hosted setup runs on a single €20/month VPS. We're now fully in control of our data and saving €800/month in licensing fees.\n\nThe biggest challenge was getting the team to adjust to the slightly different UX. We ran a 2-week parallel period where both tools were active. Adoption was around 90% by week two.",
    tags: ["communication", "self-hosted", "cost-saving"],
    likes: 47, recommendations: 18, saves: 23, timeAgo: "2 days ago",
    comments: [
      {
        id: "c1", author: AUTHORS.sofia, timeAgo: "1 day ago",
        content: "Which Mattermost version did you go with — cloud or self-hosted? We're evaluating the same switch right now.",
        replies: [
          {
            id: "c1r1", author: AUTHORS.lars, timeAgo: "23h ago",
            content: "Self-hosted on a Hetzner VPS in Germany. Absolutely worth it for the data sovereignty alone.",
          },
        ],
      },
      {
        id: "c2", author: AUTHORS.marie, timeAgo: "18h ago",
        content: "Great writeup! Did you migrate historical messages or start fresh?",
      },
    ],
  },
  {
    id: "p2",
    author: AUTHORS.techmigrate,
    from: "gdrive", to: "nextcloud",
    story:
      "We just wrapped our 15th Nextcloud migration this quarter. A common pattern we see: companies underestimate the metadata migration (permissions, folder structures, shared links) but overestimate the time needed for user adoption.\n\nOur typical timeline for a 50-person team: 3 days of preparation, 1 day of migration weekend, 1 week of hypercare. The main win? Clients go from €40/user/month on Workspace to ~€4/user/month self-hosted.",
    tags: ["cloud-storage", "nextcloud", "gdpr", "cost-saving"],
    likes: 112, recommendations: 64, saves: 87, timeAgo: "4 days ago",
    comments: [
      {
        id: "c3", author: AUTHORS.sofia, timeAgo: "3 days ago",
        content: "Do you handle the Neon DNS migration as part of the package or is that out of scope?",
      },
      {
        id: "c4", author: AUTHORS.lars, timeAgo: "2 days ago",
        content: "We used TechMigrate for exactly this. The hypercare week was the most valuable part.",
      },
    ],
  },
  {
    id: "p3",
    author: AUTHORS.sofia,
    from: "figma", to: "penpot",
    story:
      "6 months into using Penpot as a team of 4 designers. Here's the honest verdict: for 80% of our work it's completely on par with Figma. The SVG-native approach means exports are cleaner and the file format is open. Auto-layout is solid. Prototyping is catching up.\n\nThe gaps: third-party plugins (Penpot has fewer), and the community library ecosystem is smaller. But for a privacy-conscious team shipping B2B SaaS, the trade-offs are very much worth it.",
    tags: ["design", "penpot", "gdpr"],
    likes: 89, recommendations: 41, saves: 56, timeAgo: "5 days ago",
    comments: [
      {
        id: "c5", author: AUTHORS.marie, timeAgo: "4 days ago",
        content: "How does the Figma-to-Penpot file import work? Is it lossless?",
        replies: [
          {
            id: "c5r1", author: AUTHORS.sofia, timeAgo: "4 days ago",
            content: "About 95% lossless for normal designs. Complex variable fonts and some advanced effects need manual fixes.",
          },
        ],
      },
    ],
  },
  {
    id: "p4",
    author: AUTHORS.nordic,
    from: "zoom", to: "jitsi",
    story:
      "Nordic Cloud Solutions has now deployed Jitsi Meet for over 30 organisations in the Nordics. Key finding: for internal meetings, self-hosted Jitsi is a complete Zoom replacement. For large webinars (500+ attendees), you'll want to size your server carefully or consider a managed Jitsi provider.\n\nHardware recommendation for 50 concurrent rooms: 16 vCPU, 32GB RAM, dedicated 1Gbps link. Hosting in any EU data centre keeps you fully GDPR-compliant.",
    tags: ["video-calls", "jitsi", "self-hosted", "gdpr"],
    likes: 76, recommendations: 38, saves: 44, timeAgo: "1 week ago",
    comments: [
      {
        id: "c6", author: AUTHORS.lars, timeAgo: "6 days ago",
        content: "What's your go-to EU data centre for Jitsi deployments?",
      },
    ],
  },
  {
    id: "p5",
    author: AUTHORS.marie,
    from: "mailchimp", to: "brevo",
    story:
      "Switched our newsletter (22k subscribers) from Mailchimp to Brevo last month. The import was seamless — contacts, segments, and automations came over cleanly. Deliverability has been on par or slightly better. Cost went from $350/mo to €89/mo.\n\nBiggest win: Brevo's data is stored in Frankfurt and Paris, which matters a lot for our EU audience. GDPR consent management is built in rather than bolted on.",
    tags: ["email-marketing", "gdpr", "cost-saving"],
    likes: 63, recommendations: 29, saves: 38, timeAgo: "1 week ago",
    comments: [
      {
        id: "c7", author: AUTHORS.sofia, timeAgo: "6 days ago",
        content: "Any issues with the automation migration? We have complex workflows.",
      },
      {
        id: "c8", author: AUTHORS.marie, timeAgo: "6 days ago",
        content: "Simple automations came over fine. Complex multi-branch ones needed to be rebuilt, but Brevo's editor made it straightforward.",
      },
    ],
  },
];

// ─── Partners ─────────────────────────────────────────────────────────────────

export interface Partner {
  id: string;
  name: string;
  initials: string;
  color: string;
  logoUrl?: string;
  country: string;
  countryFlag: string;
  specialty: string[];
  rating: number;
  reviewCount: number;
  projects: number;
  responseTime: string;
  pricing: string;
  description: string;
  verified: boolean;
  featured: boolean;
}

export const MOCK_PARTNERS: Partner[] = [
  {
    id: "p1",
    name: "TechMigrate GmbH",
    initials: "TM",
    color: "#2A5FA5",
    logoUrl: "/logos/partners/techmigrate.svg",
    country: "Germany",
    countryFlag: "🇩🇪",
    specialty: ["Nextcloud", "Mattermost", "Gitea", "ONLYOFFICE"],
    rating: 4.8,
    reviewCount: 34,
    projects: 47,
    responseTime: "< 24h",
    pricing: "From €150/h",
    description:
      "Specialists in full-stack EU cloud migrations for mid-market companies. End-to-end service from audit to hypercare.",
    verified: true,
    featured: true,
  },
  {
    id: "p2",
    name: "Nordic Cloud Solutions",
    initials: "NC",
    color: "#0F6E56",
    logoUrl: "/logos/partners/nordic-cloud.svg",
    country: "Sweden",
    countryFlag: "🇸🇪",
    specialty: ["Jitsi", "Nextcloud", "Penpot", "Matrix"],
    rating: 4.9,
    reviewCount: 61,
    projects: 82,
    responseTime: "< 4h",
    pricing: "From €120/h",
    description:
      "Nordic-based open-source migration experts. Trusted by public sector and healthcare organisations across Scandinavia.",
    verified: true,
    featured: true,
  },
  {
    id: "p3",
    name: "EuroStack Consulting",
    initials: "ES",
    color: "#7238F5",
    logoUrl: "/logos/partners/eurostack.svg",
    country: "France",
    countryFlag: "🇫🇷",
    specialty: ["Brevo", "SuiteCRM", "Twenty CRM", "AppFlowy"],
    rating: 4.6,
    reviewCount: 22,
    projects: 31,
    responseTime: "< 48h",
    pricing: "From €110/h",
    description:
      "French consultancy focused on CRM and marketing stack migrations. Deep expertise in GDPR compliance and data portability.",
    verified: true,
    featured: false,
  },
  {
    id: "p4",
    name: "OpenShift Partners B.V.",
    initials: "OS",
    color: "#E11D48",
    logoUrl: "/logos/partners/openshift-partners.svg",
    country: "Netherlands",
    countryFlag: "🇳🇱",
    specialty: ["Gitea", "Plane", "Mattermost", "Nextcloud"],
    rating: 4.7,
    reviewCount: 18,
    projects: 26,
    responseTime: "< 24h",
    pricing: "From €130/h",
    description:
      "Dutch DevOps specialists helping engineering teams move their entire toolchain to self-hosted EU alternatives.",
    verified: true,
    featured: false,
  },
  {
    id: "p5",
    name: "Iberia Digital S.L.",
    initials: "ID",
    color: "#F59E0B",
    logoUrl: "/logos/partners/iberia-digital.svg",
    country: "Spain",
    countryFlag: "🇪🇸",
    specialty: ["Penpot", "AppFlowy", "Mattermost"],
    rating: 4.5,
    reviewCount: 14,
    projects: 19,
    responseTime: "< 48h",
    pricing: "From €90/h",
    description:
      "Southern European migration partner with strong design tool expertise. Penpot certified consultants on staff.",
    verified: false,
    featured: false,
  },
  {
    id: "p6",
    name: "Baltic Open Source OÜ",
    initials: "BO",
    color: "#0891B2",
    logoUrl: "/logos/partners/baltic-open-source.svg",
    country: "Estonia",
    countryFlag: "🇪🇪",
    specialty: ["Nextcloud", "Gitea", "Jitsi", "Brevo"],
    rating: 4.8,
    reviewCount: 29,
    projects: 41,
    responseTime: "< 12h",
    pricing: "From €100/h",
    description:
      "Estonia-based open-source consultancy. Experts in e-government and SME migrations across the Baltic states.",
    verified: true,
    featured: false,
  },
];
