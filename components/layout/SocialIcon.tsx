import { isKnownPlatform, platformLabel } from "@/lib/company-shared";

/**
 * Icons for the networks the footer knows, as inline SVG.
 *
 * Inline rather than an icon package: five glyphs is not worth a dependency, and
 * a footer icon must not wait for a separate request. Anything the editor enters
 * that is not in this map falls back to the platform name as text, so adding a
 * network is a content change, not a deployment.
 */
const paths: Record<string, string> = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.02-3.06-1.9-3.06-1.9 0-2.2 1.46-2.2 2.96V21h-4V9Z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z",
  facebook:
    "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.28-.04-1.26-.12-2.4-.12-2.37 0-4 1.45-4 4.1v2.32H7.6V13h2.3v8h3.6Z",
  instagram:
    "M12 2.2c-2.66 0-2.99.01-4.04.06-1.05.05-1.77.22-2.4.46a4.8 4.8 0 0 0-1.74 1.13A4.8 4.8 0 0 0 2.7 5.6c-.24.62-.4 1.34-.46 2.39C2.2 9.03 2.2 9.36 2.2 12s.01 2.97.06 4.02c.05 1.05.22 1.77.46 2.4a4.8 4.8 0 0 0 1.13 1.73 4.8 4.8 0 0 0 1.74 1.13c.62.24 1.34.4 2.39.46 1.05.05 1.38.06 4.04.06s2.99-.01 4.04-.06c1.05-.05 1.77-.22 2.4-.46a5.14 5.14 0 0 0 2.86-2.86c.24-.62.4-1.34.46-2.39.05-1.05.06-1.38.06-4.02s-.01-2.97-.06-4.02c-.05-1.05-.22-1.77-.46-2.4a4.8 4.8 0 0 0-1.13-1.73 4.8 4.8 0 0 0-1.74-1.13c-.62-.24-1.34-.4-2.39-.46C14.99 2.21 14.66 2.2 12 2.2Zm0 1.77c2.62 0 2.92.01 3.95.06.95.04 1.47.2 1.81.34.46.17.78.38 1.12.72.34.34.55.66.72 1.12.13.34.3.86.34 1.81.05 1.03.06 1.33.06 3.93s-.01 2.9-.06 3.93c-.04.95-.2 1.47-.34 1.81-.17.46-.38.78-.72 1.12-.34.34-.66.55-1.12.72-.34.13-.86.3-1.81.34-1.03.05-1.33.06-3.95.06s-2.92-.01-3.95-.06c-.95-.04-1.47-.2-1.81-.34a3.02 3.02 0 0 1-1.12-.72 3.02 3.02 0 0 1-.72-1.12c-.13-.34-.3-.86-.34-1.81-.05-1.03-.06-1.33-.06-3.93s.01-2.9.06-3.93c.04-.95.2-1.47.34-1.81.17-.46.38-.78.72-1.12.34-.34.66-.55 1.12-.72.34-.13.86-.3 1.81-.34 1.03-.05 1.33-.06 3.95-.06Zm0 3.01a5.02 5.02 0 1 0 0 10.04 5.02 5.02 0 0 0 0-10.04Zm0 8.28a3.26 3.26 0 1 1 0-6.52 3.26 3.26 0 0 1 0 6.52Zm6.4-8.48a1.17 1.17 0 1 1-2.35 0 1.17 1.17 0 0 1 2.35 0Z",
  x: "M17.53 3h3.2l-6.99 8 8.22 10h-6.44l-5.05-6.15L4.7 21H1.5l7.28-8.32L.9 3h6.6l4.7 5.72L17.53 3Zm-1.13 16h1.77L6.62 4.9H4.72L16.4 19Z",
};

type SocialIconProps = {
  platform: string;
};

export default function SocialIcon({ platform }: SocialIconProps) {
  const path = isKnownPlatform(platform) ? paths[platform] : undefined;

  if (!path) return <span>{platformLabel(platform)}</span>;

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      // The link carries the accessible name, so the glyph is decoration.
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}
