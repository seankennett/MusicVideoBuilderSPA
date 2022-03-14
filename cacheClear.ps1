param (
$ZoneId = '38cb0269f6c3c468bc32f17fc465e647',
$ApiToken = 'QWZjkFEKdPFySZdP6Fy07TN6KPXOAqDrZVYVYjBR',
$FileLocation = 'C:\VSProjects\ms-identity-javascript-angular-tutorial\3-Authorization-II\2-call-api-b2c\SPA\dist\angular11-sample-app'
)

$Files = Get-ChildItem -Path $FileLocation

$RequestBody = '{"files":["https://musicvideobuilder.com"'
foreach ($File in $Files) {
    $RequestBody += -join(',"https://musicvideobuilder.com/', $File.Name, '"')
}
$RequestBody += ']}'

$RequestHeader = @{
    Authorization = "Bearer $($ApiToken)"
};

Invoke-RestMethod `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/purge_cache" `
    -Method Post `
    -ContentType  "application/json" `
    -Headers $RequestHeader `
    -Body $RequestBody