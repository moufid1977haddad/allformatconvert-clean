import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/legacyRedirects";

const nextConfig: NextConfig = {
  // Mesuré le 22/09 : sans ce réglage, le build (Next 16.2.6 / Turbopack) génère des cartes de
  // source complètes pour les paquets serveur (~64 Mo sur 141 Mo de .next/server, ~45%). Elles ne
  // sont jamais servies à un visiteur -- seulement utiles pour symboliser une pile d'erreurs, ce
  // qu'on ne fait pas aujourd'hui. `productionBrowserSourceMaps` (cartes côté navigateur) est déjà
  // à false par défaut ; celui-ci vise spécifiquement les paquets serveur. Voir
  // docs/audit/RAPPORT-poids-deploiement.md pour la mesure avant/après.
  experimental: {
    serverSourceMaps: false,
  },
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
