# Script PowerShell - Injecter les icônes dans le h1 de chaque page d'outil
# Supprimer d'abord le layout.jsx
Remove-Item -Force "app\tools\layout.jsx" -ErrorAction SilentlyContinue

# Mapping complet : slug -> icone (basé sur les pages de catégories)
$icons = @{
  # PDF Tools
  'pdf-merge'          = '🔗'
  'pdf-split'          = '✂️'
  'pdf-compress'       = '📦'
  'pdf-protect'        = '🔒'
  'pdf-unlock'         = '🔓'
  'pdf-rotate'         = '🔄'
  'pdf-watermark'      = '💧'
  'image-to-pdf'       = '🖼️'
  'pdf-to-image'       = '🗃️'
  'pdf-to-jpg'         = '📷'
  'jpg-to-pdf'         = '📸'
  'word-to-pdf'        = '📝'
  'pdf-to-word'        = '📎'
  'excel-to-pdf'       = '📊'
  'pdf-to-excel'       = '📊'
  'pdf-to-ppt'         = '📤'
  'ppt-to-pdf'         = '📥'
  'html-to-pdf'        = '🌐'
  'text-to-pdf'        = '📄'
  'markdown-to-pdf'    = '📋'
  'epub-to-pdf'        = '📚'
  'mobi-to-pdf'        = '📱'
  'pdf-to-html'        = '🌐'
  'pdf-delete-pages'   = '🗑️'
  'pdf-reorder-pages'  = '🔀'
  'pdf-organize'       = '📂'
  'pdf-extract-text'   = '📃'
  'pdf-number-pages'   = '🔢'
  'pdf-editor'         = '✏️'
  'pdf-sign'           = '✍️'
  'pdf-ocr'            = '🔍'
  'pdf-forms'          = '📋'
  'pdf-redact'         = '⬛'
  'pdf-crop'           = '✂️'
  'pdf-compare'        = '📐'
  'pdf-to-pdfa'        = '📁'
  'pdf-repair'         = '🔧'
  'pdf-ai-summary'     = '🤖'
  'pdf-translate'      = '🌐'
  # Image Tools
  'image-compressor'   = '🗜️'
  'image-converter'    = '🔄'
  'image-resizer'      = '📐'
  'image-cropper'      = '✂️'
  'image-rotate'       = '🔃'
  'image-flip'         = '🔁'
  'round-corners'      = '⬜'
  'add-text-to-image'  = '✏️'
  'image-editor'       = '🖼️'
  'add-border-to-image'= '🔲'
  'brightness-contrast'= '☀️'
  'image-comparison'   = '🔍'
  'duplicate-image-finder'= '🔎'
  'grayscale-converter'= '⚫'
  'image-blur'         = '💧'
  'image-inverter'     = '🔀'
  'sepia-filter'       = '🟫'
  'image-metadata'     = '📊'
  'image-pixelator'    = '🟦'
  'add-noise'          = '🌫️'
  'add-vignette'       = '🔵'
  'heic-to-jpg'        = '📱'
  'heic-to-png'        = '📱'
  'webp-to-png'        = '🌐'
  'webp-to-jpg'        = '🌐'
  'png-to-jpg'         = '🖼️'
  'jpg-to-png'         = '🖼️'
  'svg-to-png'         = '📐'
  'png-to-ico'         = '🎯'
  'jpg-to-webp'        = '🌐'
  'png-to-webp'        = '🌐'
  'gif-to-png'         = '🎞️'
  'bmp-to-png'         = '🖼️'
  'tiff-to-png'        = '🖼️'
  'tiff-to-jpg'        = '🖼️'
  'ico-to-png'         = '🎯'
  'image-to-base64'    = '💾'
  # GIF Tools
  'video-to-gif'       = '🎬'
  'mp4-to-gif'         = '🎬'
  'webm-to-gif'        = '🎬'
  'apng-to-gif'        = '🖼️'
  'gif-to-mp4'         = '🎞️'
  'gif-to-apng'        = '🖼️'
  'image-to-gif'       = '🖼️'
  'mov-to-gif'         = '🎬'
  'avi-to-gif'         = '🎬'
  # Audio Tools
  'audio-converter'    = '🔄'
  'audio-trimmer'      = '✂️'
  'audio-compressor'   = '🔇'
  'audio-merger'       = '🎚️'
  'audio-splitter'     = '📻'
  'audio-booster'      = '📢'
  'audio-equalizer'    = '🎼'
  'audio-waveform'     = '🌊'
  'audio-metadata'     = '🔈'
  'voice-recorder'     = '🎤'
  'audio-to-text'      = '🎙️'
  # Media Tools
  'video-to-audio'     = '🎵'
  'video-compressor'   = '🎬'
  'video-converter'    = '🔄'
  'video-trimmer'      = '✂️'
  'video-screenshot'   = '📸'
  'gif-maker'          = '🎞️'
  'gif-compressor'     = '🖼️'
  'media-player'       = '▶️'
  'video-metadata'     = '📊'
  'video-watermark'    = '🎭'
  'subtitle-generator' = '📝'
  'screen-recorder'    = '📱'
  'video-merger'       = '🔀'
  'video-rotator'      = '🔄'
  'video-resizer'      = '📐'
  'video-filter'       = '🎨'
  # Text Tools
  'word-counter'       = '🔢'
  'case-converter'     = '🔤'
  'text-reverser'      = '🔁'
  'duplicate-remover'  = '🗑️'
  'text-sorter'        = '↔️'
  'find-replace'       = '🔍'
  'text-comparator'    = '📊'
  'whitespace-remover' = '🧹'
  'lorem-ipsum'        = '📝'
  'url-encoder'        = '🌐'
  'text-to-list'       = '📋'
  'text-truncator'     = '📏'
  'text-repeater'      = '🔠'
  'character-counter'  = '🧮'
  'text-encryptor'     = '🔐'
  'ascii-art'          = '🔣'
  'sticky-notes'       = '📌'
  # File Tools
  'zip-extractor'      = '📦'
  'zip-creator'        = '🗜️'
  'tar-extractor'      = '📂'
  'file-converter'     = '🔄'
  'file-encryptor'     = '🔐'
  'file-metadata'      = '📊'
  'base64-encoder'     = '🧮'
  'file-comparator'    = '🔍'
  'file-splitter'      = '✂️'
  # AI Tools
  'background-remover' = '🖼️'
  'image-upscaler'     = '📈'
  'grammar-fixer'      = '✍️'
  'text-summarizer'    = '📝'
  'ai-translator'      = '🌐'
  'image-generator'    = '🎨'
  'ai-chatbot'         = '💬'
  'ai-writer'          = '📄'
  'ai-detector'        = '🔍'
  'audio-transcriber'  = '🎵'
  'sentiment-analyzer' = '😊'
  'image-captioner'    = '🏷️'
  'data-extractor'     = '📊'
  'ai-paraphraser'     = '🔤'
  'email-generator'    = '📧'
  'keyword-extractor'  = '🎯'
  # Developer Tools
  'xml-to-json'        = '🔄'
  'json-to-xml'        = '🔄'
  'tsv-to-csv'         = '📊'
  'csv-to-tsv'         = '📊'
  'excel-to-json'      = '📗'
  'excel-to-csv'       = '📗'
  'csv-to-excel'       = '📗'
  'toml-to-json'       = '🔄'
  'json-to-toml'       = '🔄'
  'json-formatter'     = '📋'
  'json-minifier'      = '🗜️'
  'uuid-generator'     = '🔑'
  'hash-generator'     = '🔑'
  'password-generator' = '🔒'
  'csv-to-json'        = '📊'
  'json-to-csv'        = '📊'
  'css-formatter'      = '🎨'
  'html-formatter'     = '📝'
  'js-minifier'        = '⚡'
  'javascript-formatter'= '⚡'
  'scss-to-css'        = '🎨'
  'typescript-to-js'   = '🔷'
  'xml-formatter'      = '📋'
  'sql-formatter'      = '🗄️'
  'regex-tester'       = '🔍'
  'markdown-previewer' = '📝'
  'markdown-to-html'   = '🔄'
  'jwt-decoder'        = '🔒'
  'markdown-editor'    = '🖥️'
  'api-tester'         = '📡'
  'number-base-converter'= '🔢'
  'yaml-to-json'       = '📦'
  'json-to-yaml'       = '📦'
  'color-picker'       = '🌈'
  'timestamp-converter'= '⏱️'
  'aspect-ratio'       = '📐'
  'url-parser'         = '🔗'
  'html-encoder'       = '🌐'
  'html-entity-decoder'= '🌐'
  'unicode-converter'  = '🔣'
  'hex-to-text'        = '🔡'
  'json-to-typescript' = '🔷'
  'json-to-go'         = '🐹'
  'json-to-rust'       = '🦀'
  'json-to-python'     = '🐍'
  'json-to-php'        = '🐘'
  'json-to-csharp'     = '🔷'
  'csv-to-sql'         = '🗄️'
  'sql-to-csv'         = '🗄️'
  'env-to-json'        = '⚙️'
  'code-minifier'      = '🗜️'
  'diff-viewer'        = '🔍'
  'code-formatter'     = '✨'
  'cron-expression-builder'= '⏰'
  'cron-expression'    = '⏰'
  'base64-encoder'     = '🔐'
  # Converter Tools
  'currency-converter' = '💱'
  'unit-converter'     = '📏'
  'color-converter'    = '🎨'
  'mobi-to-epub'       = '📚'
  # Math Tools
  'number-base-converter'= '🔢'
  'percentage-calculator'= '📊'
  'roman-numeral-converter'= '🔣'
  'scientific-calculator'= '📐'
  'fraction-calculator'= '📏'
  'statistics-calculator'= '📉'
  # QR Tools
  'qr-generator'       = '📱'
  'qr-scanner'         = '🔍'
  'barcode-generator'  = '📊'
}

# Parcourir tous les fichiers page.jsx et page.tsx dans app/tools
$files = Get-ChildItem -Path "app\tools" -Recurse -Include "page.jsx","page.tsx" | Where-Object {
  # Exclure les pages de catégories (depth = 3) et la page principale tools
  ($_.FullName -split '\\').Count -gt 6
}

$count = 0
foreach ($file in $files) {
  $slug = $file.Directory.Name
  $icon = $icons[$slug]
  
  if ($icon) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Vérifier si le h1 existe et n'a pas déjà l'icône
    if ($content -match '<h1[^>]*>([^<]+)</h1>') {
      $h1Text = $matches[1].Trim()
      
      # Ne pas ajouter si l'icône est déjà là
      if (-not ($h1Text -match '^[\p{So}\p{Cs}]')) {
        # Remplacer le h1 en ajoutant l'icône
        $newContent = $content -replace '(<h1[^>]*>)(.*?)(</h1>)', "`$1$icon `$2`$3"
        Set-Content $file.FullName $newContent -Encoding UTF8 -NoNewline
        Write-Host "✅ $slug -> $icon"
        $count++
      } else {
        Write-Host "⏭️  $slug -> already has icon"
      }
    }
  } else {
    Write-Host "⚠️  No icon for: $slug"
  }
}

Write-Host ""
Write-Host "Done! $count files updated."
