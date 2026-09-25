$lines = Get-Content "src\components\ClipsGrid.tsx"
$idx = -1
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^export default ClipsGrid") { $idx = $i; break } }
Write-Host "First export at index: $idx"
if ($idx -gt 0) { $lines[0..$idx] | Set-Content "src\components\ClipsGrid.tsx" -Encoding UTF8; Write-Host "Done. Lines: $((Get-Content ""src\components\ClipsGrid.tsx"").Count)" }
