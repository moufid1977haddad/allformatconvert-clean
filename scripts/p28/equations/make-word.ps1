# P28: a Word-native equations document, written BY WORD (Office Math, OMML) through COM, saved in every Word format
# our Word to PDF page sends to Gotenberg (.docx goes to ConvertAPI in production, the others to Gotenberg), and Word's
# own PDF of it as the visual reference.
#   powershell -File scripts/p28/equations/make-word.ps1 <out-dir>
param([string]$out)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $out | Out-Null
$out = (Resolve-Path $out).Path
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
try {
  $d = $w.Documents.Add()
  $s = $w.Selection
  $s.Style = $d.Styles.Item(-2)  # Heading 1
  $s.TypeText('Equations written in Word (Office Math)')
  $s.TypeParagraph()
  $eqs = @(
    @('The quadratic formula:', 'x=(-b±√(b^2-4ac))/2a'),
    @('Euler''s identity, inline in a sentence:', 'e^(iπ)+1=0'),
    @('A sum:', '∑_(k=1)^n▒k=(n(n+1))/2'),
    @('A Gaussian integral:', '∫_0^∞▒e^(-x^2) dx=√π/2'),
    @('A limit:', 'lim┬(n→∞)〖(1+1/n)^n 〗=e'),
    @('A matrix:', 'A=[■(1&2@3&4)]'),
    @('Maxwell (Greek and vectors):', '∇×E=-∂B/∂t')
  )
  foreach ($e in $eqs) {
    $s.Style = $d.Styles.Item(-1)  # Normal
    $s.TypeText($e[0])
    $s.TypeParagraph()
    $r = $s.Range
    $r.Text = $e[1]
    $m = $d.OMaths.Add($r)
    $m.OMaths.Item(1).BuildUp()
    $s.EndKey(6) | Out-Null
    $s.TypeParagraph()
  }
  $s.TypeText('Text after the equations: the end.')
  $base = Join-Path $out 'word-omml'
  $d.SaveAs2("$base.docx", 16)
  $d.ExportAsFixedFormat("$base.word.pdf", 17)
  $d.SaveAs2("$base.rtf", 6)
  $d.SaveAs2("$base.odt", 23)
  $d.SaveAs2("$base.docm", 13)
  $d.SaveAs2("$base.dotx", 14)
  $d.SaveAs2("$base.doc", 0)
  $d.Close(0)
  'ok'
} finally { $w.Quit([ref]0) }
