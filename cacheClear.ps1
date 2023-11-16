param (
$ZoneId,
$ApiToken,
$FileLocation
)

$Files = Get-ChildItem -Path $FileLocation -Attributes !Directory

$RequestBody = '{"files":["https://musicvideobuilder.com"'
foreach ($File in $Files) {
    if ($File.Name -ne 'favicon.ico' -and $File.Name -ne 'browserconfig.xml') {
        $RequestBody += -join(',"https://musicvideobuilder.com/', $File.Name, '"')
    }
}
$RequestBody += ']}'

Write-Host "Request Body: $($RequestBody)"

$RequestHeader = @{
    Authorization = "Bearer $($ApiToken)"
};

Invoke-RestMethod `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/purge_cache" `
    -Method Post `
    -ContentType  "application/json" `
    -Headers $RequestHeader `
    -Body $RequestBody