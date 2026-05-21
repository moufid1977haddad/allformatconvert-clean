'use client';
import { useState, useCallback } from 'react';

export default function ImageConverterPage() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(80);
  const [converted, setConverted] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
    setFiles(imageFiles);
    setConverted([]);
  }, []);

  const convertImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        let mime = 'image/webp';
        if (format === 'jpg') mime = 'image/jpeg';
        if (format === 'png') mime = 'image/png';
        if (format === 'avif') mime = 'image/avif';
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, mime, quality / 100);
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const handleConvert = async () => {
    setProcessing(true);
    const results = [];
    for (const file of files) {
      const convertedBlob = await convertImage(file);
      results.push({
        originalName: file.name,
        originalSize: file.size,
        convertedBlob,
        convertedSize: convertedBlob.size
      });
    }
    setConverted(results);
    setProcessing(false);
  };

  const downloadAll = () => {
    if (converted.length === 1) {
      const blob = converted[0].convertedBlob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = converted[0].originalName.replace(/\.[^.]+$/, '.' + format);
      a.click();
      URL.revokeObjectURL(url);
    } else if (converted.length > 1) {
      // Pour plusieurs fichiers, on pourrait faire un ZIP
      alert(\\ fichiers prêts - Fonctionnalité ZIP à venir\);
    }
  };

  return (
    <div className=\"min-h-screen bg-neutral-950 text-neutral-100 p-6\">
      <h1 className=\"text-2xl font-bold mb-4\">🖼️ Convertir des images</h1>
      <p className=\"text-neutral-400 mb-6\">100% local — rien n'est envoyé sur un serveur</p>
      
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className=\"border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center hover:border-indigo-500 transition cursor-pointer\"
      >
        <p className=\"text-neutral-400\">📁 Glissez vos images ici</p>
        <p className=\"text-neutral-600 text-sm mt-2\">PNG, JPG, WebP, AVIF</p>
      </div>
      
      {files.length > 0 && (
        <div className=\"mt-6\">
          <h3 className=\"font-semibold mb-2\">{files.length} fichier(s) sélectionné(s)</h3>
          <div className=\"flex gap-2 mb-4\">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className=\"bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2\"
            >
              <option value=\"png\">PNG</option>
              <option value=\"jpg\">JPG</option>
              <option value=\"webp\">WebP</option>
              <option value=\"avif\">AVIF</option>
            </select>
            <input
              type=\"range\"
              min=\"0\"
              max=\"100\"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className=\"flex-1\"
            />
            <span className=\"text-sm\">{quality}%</span>
          </div>
          
          <button
            onClick={handleConvert}
            disabled={processing}
            className=\"bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 transition disabled:opacity-50\"
          >
            {processing ? 'Conversion en cours...' : 'Convertir'}
          </button>
          
          {converted.length > 0 && (
            <div className=\"mt-4\">
              <h3 className=\"font-semibold mb-2\">Résultats :</h3>
              {converted.map((item, idx) => (
                <div key={idx} className=\"bg-neutral-900 p-3 rounded-lg mb-2\">
                  <p>{item.originalName}</p>
                  <p className=\"text-sm text-neutral-400\">
                    {(item.originalSize / 1024).toFixed(1)} KB → {(item.convertedSize / 1024).toFixed(1)} KB
                    ({Math.round((1 - item.convertedSize/item.originalSize)*100)}% gain)
                  </p>
                </div>
              ))}
              <button
                onClick={downloadAll}
                className=\"bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition mt-2\"
              >
                Télécharger tous les fichiers
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
