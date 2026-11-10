/**
 * Validates and sanitizes OAuth redirect target paths.
 * Prevents Open Redirect vulnerabilities (CWE-601):
 * - Disallows protocol-relative URLs (//example.com)
 * - Disallows backslash normalization attacks (/\example.com, /\\example.com)
 * - Disallows URL-encoded slashes (%2f%2f, %5c)
 * - Disallows external schemes (http:, https:, javascript:, data:)
 * - Verifies origin strictly matches application origin
 * - Defaults safely to /dashboard on any violation
 */
export function sanitizeRedirectTarget(target: string | null | undefined, appOrigin: string): string {
  if (!target || typeof target !== "string") {
    return "/dashboard";
  }

  const trimmed = target.trim();
  // Must be an absolute local path starting with '/' and not '//' or containing '\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/dashboard";
  }

  // Check URL-decoded payload to prevent encoded backslashes or double slashes
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
      return "/dashboard";
    }
  } catch {
    // Malformed URI encoding
    return "/dashboard";
  }

  try {
    const parsed = new URL(trimmed, appOrigin);
    // Origin must strictly match appOrigin
    if (parsed.origin !== appOrigin) {
      return "/dashboard";
    }
    // Protocol must match appOrigin's protocol
    const appProtocol = new URL(appOrigin).protocol;
    if (parsed.protocol !== appProtocol) {
      return "/dashboard";
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/dashboard";
  }
}
