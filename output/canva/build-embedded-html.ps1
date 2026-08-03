$ErrorActionPreference = "Stop"

$sourceDir = "D:\kampai-school-main\output\infographics"
$outFile = "D:\kampai-school-main\output\canva\kampai-school-infographics-embedded.html"
$images = Get-ChildItem $sourceDir -Filter "*.png" | Sort-Object Name
$labels = @(
  "ภาพรวมระบบเว็บโรงเรียน",
  "เว็บไซต์ประชาสัมพันธ์โรงเรียน",
  "Admin Dashboard",
  "Teacher and Parent Portal",
  "คลังสื่อและเกมการศึกษา",
  "ข้อมูล เอกสาร และความปลอดภัย"
)

$html = New-Object System.Collections.Generic.List[string]
$html.Add('<!doctype html>')
$html.Add('<html lang="th">')
$html.Add('<head>')
$html.Add('<meta charset="utf-8">')
$html.Add('<meta name="viewport" content="width=device-width, initial-scale=1">')
$html.Add('<title>ระบบเว็บโรงเรียนครบวงจร โรงเรียนบ้านคำไผ่</title>')
$html.Add('<style>*{box-sizing:border-box}body{margin:0;background:#eef7ff}.slide{width:1600px;height:900px;overflow:hidden;background:#fff;position:relative}.slide img{width:100%;height:100%;object-fit:cover;display:block}</style>')
$html.Add('</head>')
$html.Add('<body>')

for ($i = 0; $i -lt $images.Count; $i++) {
  $label = $labels[$i]
  $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($images[$i].FullName))
  $html.Add("<section class=""slide"" data-document-role=""page"" data-label=""$label""><img src=""data:image/png;base64,$base64"" alt=""$label""></section>")
}

$html.Add('</body>')
$html.Add('</html>')

[IO.File]::WriteAllLines($outFile, $html, [Text.UTF8Encoding]::new($false))
Get-Item $outFile | Select-Object FullName, Length
