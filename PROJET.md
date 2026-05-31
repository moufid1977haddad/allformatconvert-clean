# AllFormatConvert - État du projet

## Infos générales
- **Site:** https://allformatconvert.com
- **Repo GitHub:** https://github.com/moufid1977haddad/allformatconvert-clean
- **Hébergement:** Vercel (plan Pro)
- **Framework:** Next.js 16.2.6
- **Dossier local:** C:\Users\moufi\Desktop\projet-recupere\src
- **Commande dev:** `npm run dev -- --webpack`

## APIs configurées (.env.local)
- `OPENAI_API_KEY` — OpenAI (GPT-4o-mini + Whisper) — $14.99 crédits
- `REMOVEBG_API_KEY` — remove.bg (background remover)

## Structure du projet
- `app/page.jsx` — Page d'accueil (11 catégories)
- `app/tools/page.jsx` — Page outils (même contenu)
- `app/components/Navbar.jsx` — Navbar avec catégories, search, lang selector, dark mode
- `app/components/Footer.jsx` — Footer professionnel
- `app/layout.tsx` — Layout avec Google Translate
- `app/globals.css` — CSS global + dark mode + hide Google bar

## Pages créées
- `/about` — Page about
- `/contact` — Page contact
- `/login` — Page login
- `/signup` — Page signup
- `/privacy` — Privacy Policy (sans AdSense pour l'instant)
- `/terms` — Terms of Service
- `sitemap.ts` — Sitemap SEO
- `robots.ts` — Robots.txt

## Catégories et outils
1. **PDF Tools** (39 outils) — /tools/pdf-tools
2. **Image Tools** (36 outils) — /tools/image-tools
3. **GIF Tools** (9 outils) — /tools/gif-tools
4. **Audio Tools** (11 outils) — /tools/audio-tools ✅ NOUVEAU
5. **Media Tools** (28 outils) — /tools/media-tools
6. **Text Tools** (17 outils) — /tools/text-tools
7. **File Tools** (9 outils) — /tools/file-tools
8. **QR & Barcodes** (3 outils) — /tools/qr-barcodes-tools
9. **Converter Tools** (4 outils) — /tools/converter-tools
10. **Developer Tools** (54 outils) — /tools/developer-tools
11. **Math Tools** (6 outils) — /tools/math-tools
12. **AI Tools** (16 outils) — /tools/ai-tools

## AI Tools connectés à OpenAI
- Grammar Fixer, AI Translator, Text Summarizer, AI Writer
- AI Paraphraser, AI Detector, AI Chatbot, Image Captioner
- Email Generator, Audio Transcriber (Whisper), Data Extractor
- Sentiment Analyzer, Keyword Extractor, Background Remover (remove.bg)
- Image Upscaler (local canvas 8x), Image Generator (Coming Soon)

## API Routes créées
- `/api/ai` — OpenAI GPT-4o-mini (texte)
- `/api/ai-vision` — OpenAI Vision (images)
- `/api/ai-transcribe` — OpenAI Whisper (audio)
- `/api/ai-image` — Image generation
- `/api/remove-bg` — remove.bg

## Fonctionnalités navbar
- Logo AllFormatConvert (notranslate)
- 12 catégories centrées
- Search bar (recherche outils)
- Sélecteur de langue (13 langues via Google Translate)
- Dark mode toggle
- Login / Sign Up

## Ce qui reste à faire
- Corriger bugs des outils existants (PDF, Image, Video...)
- Activer DALL-E image generator (attendre historique OpenAI)
- Ajouter Google AdSense après 6 mois
- Configurer login/signup avec vraie auth (NextAuth ou Supabase)
- Tester tous les outils un par un

## Notes importantes
- Lancer avec `--webpack` (Turbopack ne marche pas sur Windows)
- Ne jamais push node_modules sur GitHub
- Toujours faire backup avant modifications importantes
- Le fichier page.jsx de la home doit être édité manuellement (emojis)
