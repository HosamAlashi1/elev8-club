# compress-videos.ps1
# Converts testimonial videos to web-optimized MP4:
#   - H.264 CRF 26, preset slow (good quality, small size)
#   - 480x854 max (portrait phone frame, @2x)
#   - -movflags faststart: moves moov atom to file start so browser
#     can begin playback after downloading just the header, not the whole file
#   - AAC 96kbps audio

$ffmpeg = "ffmpeg"
$srcDir = "src\assets\videos\testimonials"
$outDir = "src\assets\videos\testimonials\compressed"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$videos = Get-ChildItem $srcDir -Include "*.mov","*.mp4" -File

foreach ($v in $videos) {
    $out = Join-Path $outDir ($v.BaseName + ".mp4")
    $beforeMB = [math]::Round($v.Length / 1MB, 1)

    Write-Host "`nProcessing: $($v.Name) ($beforeMB MB)" -ForegroundColor Cyan

    & $ffmpeg -y -i $v.FullName `
        -vf "scale='if(gt(iw,ih),trunc(oh*a/2)*2,480)':'if(gt(iw,ih),480,trunc(ow/a/2)*2)',scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2:black" `
        -c:v libx264 -crf 26 -preset slow `
        -c:a aac -b:a 96k `
        -movflags +faststart `
        -pix_fmt yuv420p `
        $out 2>&1 | Where-Object { $_ -match "frame=|Error|error" }

    if (Test-Path $out) {
        $afterMB = [math]::Round((Get-Item $out).Length / 1MB, 1)
        $saved = [math]::Round(($beforeMB - $afterMB) / $beforeMB * 100)
        Write-Host "Done: $beforeMB MB -> $afterMB MB  (-$saved%)" -ForegroundColor Green
    } else {
        Write-Host "FAILED: $($v.Name)" -ForegroundColor Red
    }
}

Write-Host "`n=== All done. Files saved to: $outDir ===" -ForegroundColor Yellow
Write-Host "Review them, then copy to replace the originals." -ForegroundColor Yellow
