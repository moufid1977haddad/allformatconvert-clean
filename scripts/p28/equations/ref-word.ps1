# P28: Word's own PDF of one document (the visual reference for the equations corpus), through COM.
# One Word per file: a document that makes Word show a dialog hangs only its own run (the caller bounds it).
#   powershell -File scripts/p28/equations/ref-word.ps1 <document> <out.pdf>
param([string]$in, [string]$out)
$ErrorActionPreference = 'Stop'
$in = (Resolve-Path $in).Path
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$w.AutomationSecurity = 3  # never run macros of a .docm
try {
  $d = $w.Documents.Open($in, $false, $true, $false)
  $d.ExportAsFixedFormat($out, 17)
  $d.Close([ref]0)
  "word-pdf $in"
} finally { $w.Quit([ref]0) }
