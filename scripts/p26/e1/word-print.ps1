# P26 E1: print files to PDF with Microsoft Word itself (read-only open), to compare what Word shows.
# powershell -File scripts/p26/e1/word-print.ps1 <out-dir> <file>...
param([string]$out, [Parameter(ValueFromRemainingArguments)][string[]]$files)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
try {
  foreach ($f in $files) {
    $d = $w.Documents.Open($f, $false, $true, $false, '', '', $false, '', '', 0, [Type]::Missing, $false, $false, 0, $true)
    $pdf = Join-Path $out ([IO.Path]::GetFileName($f) + '.pdf')
    $d.SaveAs2($pdf, 17)
    $d.Close($false)
    Write-Output "printed $pdf"
  }
} finally { $w.Quit() }
