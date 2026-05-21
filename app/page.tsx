import Link from 'next/link'

export default function Home() {
  const tools = [
    { name: '🖼️ Convertir des images', href: '/tools/image-converter', desc: 'PNG, JPG, WebP, AVIF' },
    { name: '📦 Compresser/Redimensionner', href: '/tools/image-compressor', desc: 'Qualité + taille max' },
    { name: '📄 Outils PDF', href: '/tools/pdf-tools', desc: 'Fusion & découpe' },
    { name: '💱 Devises', href: '/tools/currency', desc: 'Taux en temps réel' },
    { name: '📱 Générer QR', href: '/tools/qr-generator', desc: 'Texte, URL, WiFi' },
    { name: '🔍 Scanner QR', href: '/tools/qr-scanner', desc: 'Par caméra' },
    { name: '🎬 Médias', href: '/tools/media', desc: 'Vidéo/Audio FFmpeg' },
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 p-4">
        <h1 className="text-2xl font-bold text-center">allformatconvert</h1>
        <p className="text-center text-neutral-400 mt-1">Convertisseurs tout-en-un, 100% local</p>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="border border-neutral-800 rounded-xl p-4 hover:border-indigo-500 transition block"
            >
              <h2 className="font-semibold text-lg">{tool.name}</h2>
              <p className="text-neutral-400 text-sm mt-1">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}