# P26 E1: reopen files in Microsoft Word (read-only, no conversion prompt) and report Word's own counts.
# powershell -File scripts/p26/e1/word-reopen.ps1 <file>...
param([Parameter(ValueFromRemainingArguments)][string[]]$files)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
try {
  foreach ($f in $files) {
    # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument, PasswordTemplate, Revert,
    #      WritePasswordDocument, WritePasswordTemplate, Format, Encoding, Visible, OpenAndRepair, DocumentDirection, NoEncodingDialog)
    $d = $w.Documents.Open($f, $false, $true, $false, '', '', $false, '', '', 0, [Type]::Missing, $false, $false, 0, $true)
    $words = $d.ComputeStatistics(0); $pages = $d.ComputeStatistics(2); $tables = $d.Tables.Count; $shapes = $d.Shapes.Count; $inl = $d.InlineShapes.Count
    Write-Output ("WORD " + [IO.Path]::GetFileName($f) + " format=" + $d.SaveFormat + " words=" + $words + " pages=" + $pages + " tables=" + $tables + " shapes=" + $shapes + " inline=" + $inl)
    $d.Close($false)
  }
} finally { $w.Quit() }
