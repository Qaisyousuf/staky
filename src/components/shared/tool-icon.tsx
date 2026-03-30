import Image from "next/image";
import { TOOLS } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface ToolIconProps {
  slug: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: {
    shell: "h-7 w-7 rounded-lg",
    fallback: "text-[10px]",
    image: 18,
  },
  md: {
    shell: "h-9 w-9 rounded-xl",
    fallback: "text-xs",
    image: 22,
  },
  lg: {
    shell: "h-11 w-11 rounded-xl",
    fallback: "text-sm",
    image: 28,
  },
  xl: {
    shell: "h-14 w-14 rounded-2xl",
    fallback: "text-base",
    image: 34,
  },
};

const TOOL_LOGOS: Partial<Record<string, string>> = {
  slack: "/logos/tools/slack.svg",
  mattermost: "/logos/tools/mattermost.svg",
  notion: "/logos/tools/notion.svg",
  appflowy: "/logos/tools/appflowy.svg",
  figma: "/logos/tools/figma.svg",
  penpot: "/logos/tools/penpot.svg",
  gdrive: "/logos/tools/gdrive.svg",
  nextcloud: "/logos/tools/nextcloud.svg",
  zoom: "/logos/tools/zoom.svg",
  jitsi: "/logos/tools/jitsi.svg",
  github: "/logos/tools/github.svg",
  gitea: "/logos/tools/gitea.svg",
  mailchimp: "/logos/tools/mailchimp.svg",
  brevo: "/logos/tools/brevo.svg",
  asana: "/logos/tools/asana.svg",
  plane: "/logos/tools/plane.svg",
  salesforce: "/logos/tools/salesforce.svg",
  suitecrm: "/logos/tools/suitecrm.svg",
  hubspot: "/logos/tools/hubspot.svg",
  twentycrm: "/logos/tools/twentycrm.svg",
};

export function ToolIcon({ slug, size = "md", className }: ToolIconProps) {
  const tool = TOOLS[slug];
  if (!tool) return null;

  const config = SIZE_CLASSES[size];
  const logoSrc = TOOL_LOGOS[slug];

  if (logoSrc) {
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

  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-bold text-white",
        config.shell,
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
  size = "md",
}: {
  from: string;
  to: string;
  size?: "sm" | "md";
}) {
  const fromTool = TOOLS[from];
  const toTool = TOOLS[to];
  if (!fromTool || !toTool) return null;

  const iconSize = size === "sm" ? "sm" : "md";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2.5">
      <ToolIcon slug={from} size={iconSize} />
      <div className={cn("flex flex-col leading-tight", textSize)}>
        <span className="font-medium text-gray-700">{fromTool.name}</span>
      </div>
      <svg
        className="h-4 w-4 shrink-0 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      <ToolIcon slug={to} size={iconSize} />
      <div className={cn("flex flex-col leading-tight", textSize)}>
        <span className="font-medium text-gray-700">{toTool.name}</span>
      </div>
    </div>
  );
}
