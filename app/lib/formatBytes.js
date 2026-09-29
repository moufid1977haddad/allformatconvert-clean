// File sizes as the visitor's own device shows them (30/09, owner): the site showed "4.91 MB" for a file that the
// iPhone and the Mac show as "5.2 MB" (5,151,217 bytes) -- the site divided by 1024 x 1024, Apple by 1,000,000.
// Convention chosen from the research: decimal SI units, 1 KB = 1,000 bytes, 1 MB = 1,000,000 bytes, as iOS
// (since iOS 11), macOS (since 10.6), Android's Files app and Squoosh report them (Apple Support 102119: "1GB = 1
// billion bytes"). Windows Explorer still divides by 1024 while writing "MB"; iPhone and Mac visitors are the ones
// who compare the page with their Files app. Rounding as Finder does: whole KB, one decimal for MB and GB.
export function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1000) return `${b} B`;
  if (b < 999_500) return `${Math.round(b / 1000)} KB`;
  if (b < 999_950_000) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e9).toFixed(1)} GB`;
}
