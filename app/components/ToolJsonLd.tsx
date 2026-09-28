// Structured data for a tool page (29/09, point 4 of croissance-29-09): WebApplication + BreadcrumbList + FAQPage,
// rendered as a native <script type="application/ld+json"> in the tool's server layout, as Next.js recommends
// (node_modules/next/dist/docs/01-app/02-guides/json-ld.md), with "<" escaped against script injection.
// The FAQ comes from the same seo.js object the page renders, so the markup can never disagree with what a visitor reads
// (Google requires FAQ structured data to match visible content).
const SITE = 'https://www.onlineconvertools.com';

export type ToolSeo = {
  name: string;
  path: string; // "/tools/<category>/<tool>"
  category: { name: string; path: string };
  description: string;
  applicationCategory: string; // schema.org: DeveloperApplication, UtilitiesApplication, EducationalApplication…
  faqs: { q: string; a: string }[];
};

export default function ToolJsonLd({ seo }: { seo: ToolSeo }) {
  const url = SITE + seo.path;
  const graph = [
    {
      '@type': 'WebApplication',
      '@id': url + '#app',
      name: seo.name,
      url,
      description: seo.description,
      applicationCategory: seo.applicationCategory,
      operatingSystem: 'Any (runs in a web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'OnlineConverTools', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: seo.category.name, item: SITE + seo.category.path },
        { '@type': 'ListItem', position: 3, name: seo.name, item: url },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: seo.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }}
    />
  );
}
