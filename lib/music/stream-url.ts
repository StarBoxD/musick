/**
 * Builds a verified Audius stream URL following documented REST API guidelines.
 */
export function buildVerifiedStreamUrl(trackId: string | number): string {
  const cleanId = encodeURIComponent(String(trackId).trim());
  return `https://api.audius.co/v1/tracks/${cleanId}/stream?app_name=VYBE`;
}

/**
 * Strict Audius domain verification.
 * Only genuine audius.co and genuine subdomains (*.audius.co), or verified
 * decentralized Audius creator node domains are allowed.
 *
 * Strict boundary rules:
 * - Must be https: protocol.
 * - Hostname must be exactly "audius.co" OR end with ".audius.co" (with a valid subdomain before the dot).
 * - OR match official decentralized creator nodes (audius-creator-X.theblueprint.xyz).
 * - Explicitly rejects lookalikes like fakeaudius.co, audius.co.attacker.com, myaudius.co, audius-phishing.org.
 */
export function isGenuineAudiusHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (!host) return false;

  // 1. Exactly audius.co
  if (host === "audius.co") return true;

  // 2. Genuine subdomain of audius.co (*.audius.co)
  if (host.endsWith(".audius.co")) {
    const sub = host.slice(0, -".audius.co".length);
    return (
      sub.length > 0 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/.test(sub)
    );
  }

  // 3. Genuine Audius decentralized creator nodes
  if (/^audius-creator-[0-9]+\.theblueprint\.xyz$/.test(host)) {
    return true;
  }

  return false;
}

/**
 * Validates whether a streaming URL meets strict HTTPS Audius stream standards.
 */
export function isValidStreamUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;

    // Strict hostname verification
    if (!isGenuineAudiusHostname(parsed.hostname)) {
      return false;
    }

    // Must have a genuine stream endpoint path
    const path = parsed.pathname.toLowerCase();
    const hasValidPath =
      path.includes("/stream") ||
      path.includes("/tracks/cidstream") ||
      path.endsWith(".m3u8") ||
      path.endsWith(".mp3");

    return hasValidPath;
  } catch {
    return false;
  }
}
