Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("d:\Hafidz\Jadwalin\public\logo.jpg")

# 1. Full logo crop: X=90..925, Y=375..640
$cropX = 90
$cropY = 370
$cropW = 840
$cropH = 265

# Create full cropped bitmap with transparent background
$outFull = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Also create icon crop: X=90..370, Y=370..640
$iconW = 275
$iconH = 265
$outIcon = New-Object System.Drawing.Bitmap($iconW, $iconH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $src.GetPixel($cropX + $x, $cropY + $y)
        
        # Calculate brightness/lightness of paper
        # Paper background has high R, G, B with slight warm/cool paper tone, roughly R=G=B > 200
        $minVal = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
        $maxVal = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
        $saturation = $maxVal - $minVal

        # If it's paper background: high brightness and low saturation
        # Color pixels (cyan, purple, blue) have high saturation or lower brightness
        $isBackground = ($minVal -gt 215 -and $saturation -lt 18) -or ($minVal -gt 230)
        
        if ($isBackground) {
            # Fully transparent
            $outFull.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            if ($x -lt $iconW) {
                $outIcon.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            }
        } elseif ($minVal -gt 185 -and $saturation -lt 25) {
            # Smooth antialiasing edge transition
            $alpha = [int](255 * (1 - (($minVal - 185) / 35.0)))
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            
            # Darken to remove white fringe
            $r = [Math]::Max(0, [int]($c.R * 0.85))
            $g = [Math]::Max(0, [int]($c.G * 0.85))
            $b = [Math]::Max(0, [int]($c.B * 0.85))
            $newColor = [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
            
            $outFull.SetPixel($x, $y, $newColor)
            if ($x -lt $iconW) {
                $outIcon.SetPixel($x, $y, $newColor)
            }
        } else {
            # Opaque foreground pixel
            $outFull.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
            if ($x -lt $iconW) {
                $outIcon.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
            }
        }
    }
}

$outFull.Save("d:\Hafidz\Jadwalin\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outIcon.Save("d:\Hafidz\Jadwalin\public\logo-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$outFull.Dispose()
$outIcon.Dispose()
$src.Dispose()
[Console]::WriteLine("Successfully generated logo.png and logo-icon.png")
