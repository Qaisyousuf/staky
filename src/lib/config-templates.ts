// Configuration item types and tool-specific templates for migration requests.

export type ConfigItemType = "text" | "url" | "secret" | "select" | "checkbox";
export type ConfigItemStatus = "pending" | "answered" | "approved" | "revision";

export interface ConfigItem {
  id: string;
  title: string;
  description?: string;
  type: ConfigItemType;
  options?: string[];       // for "select" type
  required: boolean;
  answer?: string;          // encrypted if type === "secret"
  status: ConfigItemStatus;
  partnerNote?: string;     // set when status === "revision"
  answeredAt?: string;
}

type TemplateItem = Omit<ConfigItem, "id" | "answer" | "status" | "answeredAt">;

// ─── Per-tool templates ────────────────────────────────────────────────────────

const TEMPLATES: Record<string, TemplateItem[]> = {
  slack: [
    { title: "Workspace data export", description: "Go to your Slack workspace → Settings & Administration → Workspace Settings → Import/Export Data. Export and paste the download link here.", type: "url", required: true },
    { title: "Channels to migrate", description: "List all channels that should be migrated (one per line or comma-separated).", type: "text", required: true },
    { title: "Workspace admin token", description: "Slack bot or user OAuth token with admin scope (starts with xoxp- or xoxb-). Used to automate the migration.", type: "secret", required: false },
    { title: "Integrations in use", description: "List any Slack apps or integrations that must continue working (e.g. GitHub, Jira, Zoom).", type: "text", required: false },
  ],
  notion: [
    { title: "Notion workspace export link", description: "Go to Settings → Settings → Export content → Export as Markdown & CSV. Paste the download link.", type: "url", required: true },
    { title: "Internal integration token", description: "Create an internal integration at notion.so/my-integrations and paste the token here. Used for automated data access.", type: "secret", required: false },
    { title: "Key databases and pages", description: "List the most important databases and page hierarchies to migrate.", type: "text", required: true },
    { title: "Team members and roles", description: "List team members with their Notion workspace roles.", type: "text", required: false },
  ],
  figma: [
    { title: "Files and projects to migrate", description: "List all Figma files, projects, and shared libraries that should be moved.", type: "text", required: true },
    { title: "Team member emails", description: "List all team members who need access in the new design tool.", type: "text", required: true },
    { title: "Figma personal access token", description: "Generate a token at figma.com → Account Settings → Personal access tokens. Used to automate export.", type: "secret", required: false },
    { title: "Plugins your team relies on", description: "List any Figma plugins that are part of your team workflow.", type: "text", required: false },
    { title: "Shared design system files", description: "Are there shared component libraries or brand design systems? List them.", type: "text", required: false },
  ],
  gdrive: [
    { title: "Google Takeout export link", description: "Export your Drive data at takeout.google.com (select Google Drive only). Share the download link.", type: "url", required: true },
    { title: "Users and permission levels", description: "List all users with access and their permission levels (viewer / editor / owner).", type: "text", required: true },
    { title: "Service account JSON key", description: "Google service account credentials file (JSON) for automated migration API access.", type: "secret", required: false },
    { title: "Folder structure requirements", description: "Any specific folder organisation requirements for the new system?", type: "text", required: false },
  ],
  zoom: [
    { title: "Cloud recording archive", description: "Export or provide an access link to your Zoom cloud recordings if they need to be transferred.", type: "url", required: false },
    { title: "Meeting hosts to transfer", description: "List all users who host recurring or important meetings.", type: "text", required: true },
    { title: "Admin account credentials", description: "Zoom admin login credentials for account-level migration tasks. These will be deleted immediately after use.", type: "secret", required: false },
    { title: "Recurring meetings to preserve", description: "List important recurring meetings (name, frequency, attendees).", type: "text", required: false },
  ],
  github: [
    { title: "Repositories to migrate", description: "List all repos to migrate: name, visibility (public/private), and priority.", type: "text", required: true },
    { title: "GitHub personal access token", description: "A PAT with repo and admin:org scopes (github.com → Settings → Developer settings → Tokens).", type: "secret", required: true },
    { title: "Team and permission structure", description: "Describe your GitHub organisation structure (teams, roles, branch protections).", type: "text", required: true },
    { title: "CI/CD workflows", description: "List GitHub Actions workflows or other CI/CD pipelines that need to be ported.", type: "text", required: false },
    { title: "Webhooks and integrations", description: "List any webhooks or third-party integrations configured in the repos.", type: "text", required: false },
  ],
  salesforce: [
    { title: "Admin login credentials", description: "Salesforce admin username and password for data export. Deleted immediately after the migration.", type: "secret", required: true },
    { title: "Objects to migrate", description: "List all Salesforce objects to migrate (Accounts, Contacts, Leads, Opportunities, Cases, etc.).", type: "text", required: true },
    { title: "Custom fields and workflows", description: "Export or describe your custom fields, validation rules, and workflow automations.", type: "text", required: true },
    { title: "Estimated record counts", description: "Approximate number of records per object type (helps us estimate migration time).", type: "text", required: false },
    { title: "Third-party integrations", description: "List all apps connected to Salesforce that need to be reconnected.", type: "text", required: false },
  ],
  hubspot: [
    { title: "HubSpot private app token", description: "Create a private app at HubSpot → Settings → Integrations → Private Apps and paste the access token.", type: "secret", required: true },
    { title: "Data scope", description: "How many contacts, companies, and deals need to be migrated?", type: "text", required: true },
    { title: "Custom properties", description: "List any custom contact, company, or deal properties that must be preserved.", type: "text", required: false },
    { title: "Migrate email sequences?", description: "Should email sequences and templates be migrated?", type: "select", options: ["Yes — all sequences", "Yes — specific ones (I will list them below)", "No"], required: true },
    { title: "Active workflows", description: "List key automated workflows (e.g. lead scoring, deal stage triggers) that need to be recreated.", type: "text", required: false },
  ],
  jira: [
    { title: "Jira admin API token", description: "Go to id.atlassian.com → Security → API tokens. Create a token with admin scope.", type: "secret", required: true },
    { title: "Atlassian cloud URL", description: "Your Jira instance URL (e.g. yourcompany.atlassian.net).", type: "url", required: true },
    { title: "Projects to migrate", description: "List all Jira project keys and names.", type: "text", required: true },
    { title: "Custom issue types and workflows", description: "Describe custom issue types, fields, and workflow transitions.", type: "text", required: false },
    { title: "Confluence pages to migrate?", description: "Should Confluence documentation also be migrated?", type: "select", options: ["Yes — all spaces", "Yes — specific spaces", "No"], required: true },
  ],
  asana: [
    { title: "Asana personal access token", description: "Generate at app.asana.com/0/profile/apps → New access token.", type: "secret", required: true },
    { title: "Projects and workspaces", description: "List all Asana projects and workspaces to migrate.", type: "text", required: true },
    { title: "Team members and roles", description: "List team members and their project access levels.", type: "text", required: false },
    { title: "Custom fields", description: "List any custom fields used across your projects.", type: "text", required: false },
  ],
  trello: [
    { title: "Trello API key and token", description: "Get your API key and generate a token at trello.com/app-key.", type: "secret", required: true },
    { title: "Boards to migrate", description: "List all Trello boards to be migrated.", type: "text", required: true },
    { title: "Power-Ups in use", description: "List any Trello Power-Ups your team relies on.", type: "text", required: false },
  ],
  dropbox: [
    { title: "Dropbox export or access link", description: "Share your Dropbox folder or provide an export link for the data to migrate.", type: "url", required: true },
    { title: "Folder structure and sharing", description: "Describe your folder hierarchy and how files are shared across the team.", type: "text", required: true },
    { title: "Team members", description: "List Dropbox team members with their access levels.", type: "text", required: false },
    { title: "Connected apps", description: "List apps connected to Dropbox that must continue working (e.g. Slack, Microsoft Office).", type: "text", required: false },
  ],
};

// Generic fallback for tools not in the template library
const GENERIC_TEMPLATE: TemplateItem[] = [
  { title: "Current setup description", description: "Describe how you currently use this tool and your most critical workflows.", type: "text", required: true },
  { title: "Data export link", description: "If the tool supports data export, provide the download link here.", type: "url", required: false },
  { title: "Access credentials", description: "Admin login or API credentials needed for the migration. Deleted immediately after use.", type: "secret", required: false },
  { title: "Users and permissions", description: "List all users who need access in the new system, with their roles.", type: "text", required: true },
  { title: "Critical integrations", description: "List any third-party tools or integrations that must continue working post-migration.", type: "text", required: false },
];

export function getConfigTemplate(fromToolSlug: string): ConfigItem[] {
  const raw = TEMPLATES[fromToolSlug] ?? GENERIC_TEMPLATE;
  return raw.map((item) => ({
    ...item,
    id: generateId(),
    status: "pending" as const,
  }));
}

// Simple deterministic-ish ID generator (crypto not available in this module boundary)
function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const CONFIG_TYPE_LABELS: Record<ConfigItemType, string> = {
  text: "Text",
  url: "URL / Link",
  secret: "Secret",
  select: "Choice",
  checkbox: "Yes / No",
};
