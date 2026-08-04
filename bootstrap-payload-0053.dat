$checks = @(
    @{ Service = "Web"; Port = 5173; Url = "http://127.0.0.1:5173/" },
    @{ Service = "API"; Port = 8000; Url = "http://127.0.0.1:8000/health" }
)
$rows = foreach ($check in $checks) {
    $running = $false
    try {
        $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 2
        $running = $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    }
    catch {}
    [pscustomobject]@{
        Service = $check.Service
        Port = $check.Port
        Status = if ($running) { "RUNNING" } else { "STOPPED" }
    }
}
$rows | Format-Table -AutoSize
