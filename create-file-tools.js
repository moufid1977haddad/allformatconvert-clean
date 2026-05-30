const fs = require('fs');
const path = require('path');

const tools = {
  'zip-extractor': `'use client';
import { useState, useRef } from 'react';
export default function ZipExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const extract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const extracted = [];
      for (const [name, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('blob');
          extracted.push({ name, url: URL.createObjectURL(content), size: content.size });
        }
      }
      setFiles(extracted);
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Extractor</h1>
        <p className="text-neutral-400 text-center mb-8">Extract ZIP archive files in your browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click or drop a ZIP file here</p>
            <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={extract} />
          </div>
          {loading && <p className="text-center text-neutral-400">Extracting...</p>}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{files.length} file(s) extracted</p>
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <a href={f.url} download={f.name.split('/').pop()} className="text-indigo-400 hover:text-indigo-300 text-sm ml-2">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'zip-creator': `'use client';
import { useState, useRef } from 'react';
export default function ZipCreatorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const addFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));
  const createZip = async () => {
    setLoading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const file of files) {
        const content = await file.arrayBuffer();
        zip.file(file.name, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Creator</h1>
        <p className="text-neutral-400 text-center mb-8">Create ZIP archive files in your browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click to add files</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={createZip} disabled={files.length === 0 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create ZIP'}</button>
          {downloadUrl && <a href={downloadUrl} download="archive.zip" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download ZIP</a>}
        </div>
      </div>
    </div>
  );
}`,

  'tar-extractor': `'use client';
import { useState, useRef } from 'react';
export default function TarExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const extract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const extracted = [];
      let offset = 0;
      while (offset < bytes.length - 512) {
        const nameBytes = bytes.slice(offset, offset + 100);
        const name = new TextDecoder().decode(nameBytes).replace(/\0/g, '').trim();
        if (!name) break;
        const sizeOctal = new TextDecoder().decode(bytes.slice(offset + 124, offset + 136)).replace(/\0/g, '').trim();
        const size = parseInt(sizeOctal, 8) || 0;
        offset += 512;
        if (size > 0 && !name.endsWith('/')) {
          const content = bytes.slice(offset, offset + size);
          const blob = new Blob([content]);
          extracted.push({ name, url: URL.createObjectURL(blob), size });
        }
        offset += Math.ceil(size / 512) * 512;
      }
      setFiles(extracted);
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TAR Extractor</h1>
        <p className="text-neutral-400 text-center mb-8">Extract TAR archive files in your browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click or drop a TAR file here</p>
            <input ref={inputRef} type="file" accept=".tar" className="hidden" onChange={extract} />
          </div>
          {loading && <p className="text-center text-neutral-400">Extracting...</p>}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{files.length} file(s) extracted</p>
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <a href={f.url} download={f.name.split('/').pop()} className="text-indigo-400 hover:text-indigo-300 text-sm ml-2">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'file-metadata': `'use client';
import { useState, useRef } from 'react';
export default function FileMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMetadata({
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
      lastModified: new Date(file.lastModified).toLocaleString(),
      extension: file.name.split('.').pop().toUpperCase(),
    });
  };
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(2) + ' KB';
    return (bytes/(1024*1024)).toFixed(2) + ' MB';
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Metadata</h1>
        <p className="text-neutral-400 text-center mb-8">View file metadata and information</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click or drop any file here</p>
            <input ref={inputRef} type="file" className="hidden" onChange={analyze} />
          </div>
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-800 rounded-lg p-3">
                  <span className="text-neutral-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-indigo-400">{k === 'size' ? formatSize(v) : v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'base64-encoder': `'use client';
import { useState, useRef } from 'react';
export default function FileBase64EncoderPage() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const encode = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setResult(reader.result); setLoading(false); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File to Base64</h1>
        <p className="text-neutral-400 text-center mb-8">Convert any file to Base64 encoding</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{fileName || 'Click or drop any file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={encode} />
          </div>
          {loading && <p className="text-center text-neutral-400">Encoding...</p>}
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy Base64</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'file-encryptor': `'use client';
import { useState, useRef } from 'react';
export default function FileEncryptorPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mode, setMode] = useState('encrypt');
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setDownloadUrl(null); };
  const process = async () => {
    if (!file || !password) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const keyBytes = new TextEncoder().encode(password);
      const processed = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
      const blob = new Blob([processed]);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Encryptor</h1>
        <p className="text-neutral-400 text-center mb-8">Encrypt and decrypt files with a password</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode('encrypt')} className={\`flex-1 py-2 rounded-lg font-semibold transition \${mode === 'encrypt' ? 'bg-indigo-600' : 'bg-neutral-800'}\`}>Encrypt</button>
            <button onClick={() => setMode('decrypt')} className={\`flex-1 py-2 rounded-lg font-semibold transition \${mode === 'decrypt' ? 'bg-indigo-600' : 'bg-neutral-800'}\`}>Decrypt</button>
          </div>
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" placeholder="Enter password..." /></div>
          <button onClick={process} disabled={!file || !password || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}</button>
          {downloadUrl && <a href={downloadUrl} download={file.name + (mode === 'encrypt' ? '.encrypted' : '.decrypted')} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
    </div>
  );
}`,

  'file-comparator': `'use client';
import { useState, useRef } from 'react';
export default function FileComparatorPage() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const ref1 = useRef();
  const ref2 = useRef();
  const compare = async () => {
    if (!file1 || !file2) return;
    const [buf1, buf2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
    const bytes1 = new Uint8Array(buf1);
    const bytes2 = new Uint8Array(buf2);
    const identical = bytes1.length === bytes2.length && bytes1.every((b, i) => b === bytes2[i]);
    setResult({ identical, size1: file1.size, size2: file2.size, name1: file1.name, name2: file2.name });
  };
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Comparator</h1>
        <p className="text-neutral-400 text-center mb-8">Compare two files side by side</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref1.current.click()}>
              <p className="text-neutral-400 text-sm">{file1 ? file1.name : 'File 1'}</p>
              <input ref={ref1} type="file" className="hidden" onChange={e => setFile1(e.target.files[0])} />
            </div>
            <div className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref2.current.click()}>
              <p className="text-neutral-400 text-sm">{file2 ? file2.name : 'File 2'}</p>
              <input ref={ref2} type="file" className="hidden" onChange={e => setFile2(e.target.files[0])} />
            </div>
          </div>
          <button onClick={compare} disabled={!file1 || !file2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Compare Files</button>
          {result && (
            <div className="bg-neutral-800 rounded-xl p-6 text-center space-y-3">
              <div className={result.identical ? 'text-green-400 text-2xl font-bold' : 'text-red-400 text-2xl font-bold'}>{result.identical ? 'Files are identical' : 'Files are different'}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-neutral-400">{result.name1}</div><div className="text-indigo-400">{formatSize(result.size1)}</div></div>
                <div><div className="text-neutral-400">{result.name2}</div><div className="text-indigo-400">{formatSize(result.size2)}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'file-splitter': `'use client';
import { useState, useRef } from 'react';
export default function FileSplitterPage() {
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1);
  const [unit, setUnit] = useState('MB');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setChunks([]); };
  const split = async () => {
    if (!file) return;
    setLoading(true);
    const sizes = { B: 1, KB: 1024, MB: 1024*1024 };
    const bytesPerChunk = chunkSize * sizes[unit];
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const newChunks = [];
    for (let i = 0; i < bytes.length; i += bytesPerChunk) {
      const chunk = bytes.slice(i, i + bytesPerChunk);
      const blob = new Blob([chunk]);
      newChunks.push({ url: URL.createObjectURL(blob), size: chunk.length, index: newChunks.length + 1 });
    }
    setChunks(newChunks);
    setLoading(false);
  };
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Splitter</h1>
        <p className="text-neutral-400 text-center mb-8">Split large files into smaller parts</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Chunk Size</label><input type="number" min="1" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Unit</label><select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"><option>B</option><option>KB</option><option>MB</option></select></div>
          </div>
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split File'}</button>
          {chunks.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{chunks.length} part(s) created</p>
              {chunks.map(c => (
                <div key={c.index} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm">Part {c.index} — {formatSize(c.size)}</span>
                  <a href={c.url} download={file.name + '.part' + c.index} className="text-indigo-400 hover:text-indigo-300 text-sm">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'file-converter': `'use client';
import { useState, useRef } from 'react';
export default function FileConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('txt');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setDownloadUrl(null); };
  const convert = async () => {
    if (!file) return;
    const text = await file.text();
    let content = text;
    let mimeType = 'text/plain';
    if (format === 'json') { try { content = JSON.stringify({ content: text }, null, 2); mimeType = 'application/json'; } catch(e) {} }
    else if (format === 'csv') { content = text.split('\\n').map(l => l.split('\\t').join(',')).join('\\n'); mimeType = 'text/csv'; }
    else if (format === 'html') { content = '<!DOCTYPE html><html><body><pre>' + text + '</pre></body></html>'; mimeType = 'text/html'; }
    const blob = new Blob([content], { type: mimeType });
    setDownloadUrl(URL.createObjectURL(blob));
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert text files to different formats</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a text file here'}</p>
            <input ref={inputRef} type="file" accept=".txt,.csv,.json,.html,.md" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Convert to</label><select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"><option value="txt">TXT</option><option value="json">JSON</option><option value="csv">CSV</option><option value="html">HTML</option></select></div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
          {downloadUrl && <a href={downloadUrl} download={file.name.replace(/\.[^.]+$/, '') + '.' + format} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>}
        </div>
      </div>
    </div>
  );
}`,
};

const basePath = 'app/tools/file-tools';
Object.entries(tools).forEach(([name, content]) => {
  const filePath = path.join(basePath, name, 'page.jsx');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Created: ' + filePath);
});
console.log('All file tools created!');