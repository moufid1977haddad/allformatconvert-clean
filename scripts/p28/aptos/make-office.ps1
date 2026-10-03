# P28: an Excel workbook and a PowerPoint deck created by Office itself with its default theme (Aptos, Aptos Display),
# saved as .xlsx/.pptx, with Office's own PDF as the reference -- for the Gotenberg Aptos font rule.
#   powershell -File scripts/p28/aptos/make-office.ps1 <out-dir>
param([string]$out)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $out | Out-Null
$out = (Resolve-Path $out).Path
$x = New-Object -ComObject Excel.Application; $x.Visible = $false; $x.DisplayAlerts = $false
try {
  $b = $x.Workbooks.Add(); $s = $b.Worksheets.Item(1)
  $rows = @(@('Région', 'Trimestre', 'Chiffre d''affaires', 'Commentaire'),
    @('Île-de-France', 'T1', 125400, 'Hausse portée par les nouveaux clients'),
    @('Auvergne-Rhône-Alpes', 'T1', 98200, 'Stable, malgré la fermeture d''un magasin'),
    @('Provence-Alpes-Côte d''Azur', 'T2', 87650, 'Saison touristique en avance'),
    @('Nouvelle-Aquitaine', 'T2', 76300, 'Effet des campagnes de printemps'))
  for ($r = 0; $r -lt $rows.Count; $r++) { for ($c = 0; $c -lt 4; $c++) { $s.Cells.Item($r + 1, $c + 1).Formula = [string]$rows[$r][$c] } }
  $s.Range('A1:D1').Font.Bold = $true
  $s.Columns.AutoFit() | Out-Null
  $b.SaveAs((Join-Path $out 'aptos-excel.xlsx'), 51)
  $b.ExportAsFixedFormat(0, (Join-Path $out 'aptos-excel_xlsx.office.pdf'))
  $b.Close($false)
} finally { $x.Quit() }
$p = New-Object -ComObject PowerPoint.Application
try {
  $d = $p.Presentations.Add(0)
  $s1 = $d.Slides.Add(1, 1); $s1.Shapes.Item(1).TextFrame.TextRange.Text = 'Résultats du premier semestre'; $s1.Shapes.Item(2).TextFrame.TextRange.Text = 'Présentation au comité de direction'
  $s2 = $d.Slides.Add(2, 2); $s2.Shapes.Item(1).TextFrame.TextRange.Text = 'Points clés de la période'
  $s2.Shapes.Item(2).TextFrame.TextRange.Text = "Chiffre d'affaires en hausse de 12 % sur un an`rTrois nouvelles régions ouvertes au printemps`rMarge stable malgré la hausse des coûts de transport`rObjectifs du second semestre confirmés par l'équipe"
  $d.SaveAs((Join-Path $out 'aptos-slides.pptx'), 24)
  $d.SaveAs((Join-Path $out 'aptos-slides_pptx.office.pdf'), 32)
  $d.Close()
} finally { $p.Quit() }
'ok'
