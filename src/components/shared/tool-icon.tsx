import Image from "next/image";
import { TOOLS } from "@/data/mock-data";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DbTool {
  name: string;
  logoUrl?: string | null;
  color: string;
  abbr: string;
  country?: string | null;
}

interface ToolIconProps {
  /** Legacy: look up tool from mock-data by slug */
  slug?: string;
  /** New: pass a DB tool object directly (logoUrl takes priority over local SVGs) */
  toolData?: DbTool;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  plain?: boolean;
}

const SIZE_CLASSES = {
  sm: { shell: "h-7 w-7 rounded-lg",    fallback: "text-[10px]", image: 28  },
  md: { shell: "h-9 w-9 rounded-xl",    fallback: "text-xs",     image: 36  },
  lg: { shell: "h-11 w-11 rounded-xl",  fallback: "text-sm",     image: 44  },
  xl: { shell: "h-14 w-14 rounded-2xl", fallback: "text-base",   image: 56  },
};

// Local SVG logos from public/logos/tools/
const TOOL_LOGOS: Partial<Record<string, string>> = {
  slack:      "/logos/tools/slack.svg",
  mattermost: "/logos/tools/mattermost.svg",
  notion:     "/logos/tools/notion.svg",
  appflowy:   "/logos/tools/appflowy.svg",
  figma:      "/logos/tools/figma.svg",
  penpot:     "/logos/tools/penpot.svg",
  gdrive:     "/logos/tools/gdrive.svg",
  nextcloud:  "/logos/tools/nextcloud.svg",
  zoom:       "/logos/tools/zoom.svg",
  jitsi:      "/logos/tools/jitsi.svg",
  github:     "/logos/tools/github.svg",
  gitea:      "/logos/tools/gitea.svg",
  mailchimp:  "/logos/tools/mailchimp.svg",
  brevo:      "/logos/tools/brevo.svg",
  asana:      "/logos/tools/asana.svg",
  plane:      "/logos/tools/plane.svg",
  salesforce: "/logos/tools/salesforce.svg",
  suitecrm:   "/logos/tools/suitecrm.svg",
  hubspot:    "/logos/tools/hubspot.svg",
  twentycrm:  "/logos/tools/twentycrm.svg",
  forgejo:    "/logos/tools/forgejo.svg",
};

export function ToolIcon({ slug, toolData, size = "md", className, plain = false }: ToolIconProps) {
  const config = SIZE_CLASSES[size];

  // ── DB tool path ─────────────────────────────────────────────────────────────
  if (toolData) {
    const { name, logoUrl, color, abbr } = toolData;

    // Prefer DB logoUrl, then local SVG by slug (covers slugs not in DB)
    const effectiveLogo = logoUrl || (slug ? TOOL_LOGOS[slug] : null);

    if (effectiveLogo) {
      if (plain) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveLogo}
            alt={`${name} logo`}
            width={config.image}
            height={config.image}
            className={cn("object-contain", className)}
          />
        );
      }
      return (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
            config.shell,
            className
          )}
          title={name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={effectiveLogo}
            alt={`${name} logo`}
            width={config.image}
            height={config.image}
            className="h-auto w-auto max-h-[70%] max-w-[70%] object-contain"
          />
        </span>
      );
    }

    // Fallback: colored abbr badge
    return (
      <span
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center font-bold text-white",
          plain ? "rounded-xl" : config.shell,
          config.fallback,
          className
        )}
        style={{ backgroundColor: color }}
        title={name}
      >
        {abbr}
      </span>
    );
  }

  // ── Legacy slug path ──────────────────────────────────────────────────────────
  const tool = slug ? TOOLS[slug] : undefined;
  if (!tool) return null;

  const logoSrc = slug ? TOOL_LOGOS[slug] : undefined;

  if (logoSrc) {
    if (plain) {
      return (
        <Image
          src={logoSrc}
          alt={`${tool.name} logo`}
          width={config.image}
          height={config.image}
          className={cn("object-contain", className)}
        />
      );
    }
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
          config.shell,
          className
        )}
        title={tool.name}
      >
        <Image
          src={logoSrc}
          alt={`${tool.name} logo`}
          width={config.image}
          height={config.image}
          className="h-auto w-auto max-h-[70%] max-w-[70%] object-contain"
        />
      </span>
    );
  }

  // Fallback: colored badge
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-bold text-white",
        plain ? "rounded-xl" : config.shell,
        config.fallback,
        className
      )}
      style={{ backgroundColor: tool.color }}
      title={tool.name}
    >
      {tool.abbr}
    </span>
  );
}

export function ToolName({ slug }: { slug: string }) {
  const tool = TOOLS[slug];
  return <span>{tool?.name ?? slug}</span>;
}

export function SwitchBadge({
  from,
  to,
  fromData,
  toData,
  size = "md",
}: {
  /** Legacy slug-based lookup */
  from?: string;
  to?: string;
  /** DB tool objects (takes priority over slug) */
  fromData?: DbTool;
  toData?: DbTool;
  size?: "sm" | "md";
}) {
  const fromTool = fromData ?? (from ? TOOLS[from] : undefined);
  const toTool   = toData   ?? (to   ? TOOLS[to]   : undefined);
  if (!fromTool || !toTool) return null;

  const iconSize = size === "sm" ? "sm" : "md";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2.5">
      <ToolIcon toolData={fromData} slug={fromData ? undefined : from} size={iconSize} />
      <div className={cn("flex flex-col leading-tight", textSize)}>
        <span className="font-medium text-gray-700">{fromTool.name}</span>
      </div>
      <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      <ToolIcon toolData={toData} slug={toData ? undefined : to} size={iconSize} />
      <div className={cn("flex flex-col leading-tight", textSize)}>
        <span className="font-medium text-gray-700">{toTool.name}</span>
      </div>
    </div>
  );
}
