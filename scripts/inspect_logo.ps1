Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("d:\Hafidz\Jadwalin\public\logo.jpg")

$bg = $bmp.GetPixel(10, 10)
[Console]::WriteLine("Corner color: R=$($bg.R), G=$($bg.G), B=$($bg.B)")

$minX = $bmp.Width; $maxX = 0; $minY = $bmp.Height; $maxY = 0

for ($y = 100; $y -lt 900; $y += 4) {
    for ($x = 50; $x -lt 950; $x += 4) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 50 -and ($c.R -lt 220 -or $c.G -lt 220 -or $c.B -lt 220)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
[Console]::WriteLine("Bounding box: X=$minX..$maxX, Y=$minY..$maxY")
$bmp.Dispose()
