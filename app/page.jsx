import HomeClient from './HomeClient';

// P35 (lot 3 — S1): the home page's own canonical (it had none; every other page sets its own). The page itself is a
// client component (app/HomeClient.jsx), which cannot export metadata: this server file only hosts it.
export const metadata = {
  alternates: { canonical: 'https://www.onlineconvertools.com/' },
};

export default function Page() {
  return <HomeClient />;
}
