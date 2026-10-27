# Rebuilds the fixed-size icons from public\images\logos\Safe Connect Logo.png:
#   public\icon-192.png, public\icon-512.png  installed-app icons (icon-512
#                                             is also the link-preview image)
#   public\apple-touch-icon.png               iPhone home screen (white background)
#   backend\assets\safeconnect-logo.png       logo on PDF reports
#
# Run it after replacing "Safe Connect Logo.png" (from the project folder):
#   powershell -ExecutionPolicy Bypass -File scripts\update-app-icons.ps1
# then commit and push. The PDF logo needs the backend redeployed to Azure.
#
# (The page logo and the browser-tab icon use the files in
# public\images\logos\ directly, so they need no script.)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'public\images\logos\Safe Connect Logo.png'
if (-not (Test-Path $source)) { throw "Not found: $source" }

function Save-Resized($dest, $size, $background) {
    $img = [System.Drawing.Image]::FromFile($source)
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($background) { $g.Clear($background) } else { $g.Clear([System.Drawing.Color]::Transparent) }
    $g.DrawImage($img, 0, 0, $size, $size)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    Write-Host ("Updated {0} ({1}x{1})" -f $dest, $size)
}

Save-Resized (Join-Path $root 'public\icon-192.png') 192 $null
Save-Resized (Join-Path $root 'public\icon-512.png') 512 $null
Save-Resized (Join-Path $root 'public\apple-touch-icon.png') 180 ([System.Drawing.Color]::White)
Save-Resized (Join-Path $root 'backend\assets\safeconnect-logo.png') 600 $null
