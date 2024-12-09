# 定义等待时间
$waitTime = 60

# 检测网络连接
function Test-Network {
    try {
        $ping = Test-Connection -Count 1 cn.bing.com -Quiet
        return $ping
    } catch {
        return $false
    }
}

# 获取源URL列表
$sourceUrls = Get-Content -Path ".\src\utils\sourceUrl.json" | ConvertFrom-Json | Select-Object -ExpandProperty url
# 初始化变量
$networkAvailable = Test-Network
$localVersion = (Get-Content -Path ".\src\data.json" | ConvertFrom-Json).version

if (-not $networkAvailable) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c start .\public\index.html"
    Start-Sleep -Seconds $waitTime
    exit
} else {
    foreach ($url in $sourceUrls) {
        try {
            Write-Host "url:$url"
            $remoteData = Invoke-RestMethod -Uri $url -TimeoutSec 30
            $remoteVersion = $remoteData.version
            if ([version]$remoteVersion -gt [version]$localVersion) {
                # 更新本地数据文件
                $remoteData | ConvertTo-Json -Depth 10 | Set-Content -Path ".\src\data.json"
                break
            }
        } catch {
            Write-Host "Failed to retrieve data from $url."
        }
    }
}

# 打开index.html并等待
Start-Process -FilePath "cmd.exe" -ArgumentList "/c start .\public\index.html"
Start-Sleep -Seconds $waitTime