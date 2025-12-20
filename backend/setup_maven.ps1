
$MavenVersion = "3.9.6"
$MavenUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
$MavenZip = "maven.zip"
$ExtractPath = "$PSScriptRoot\local-maven"

Write-Output "Downloading Maven $MavenVersion..."
# TLS 1.2 fix for older PowerShell/Windows
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $MavenUrl -OutFile $MavenZip

Write-Output "Extracting Maven..."
if (Test-Path $ExtractPath) { Remove-Item $ExtractPath -Recurse -Force }
Expand-Archive -Path $MavenZip -DestinationPath $ExtractPath -Force

Remove-Item $MavenZip
Write-Output "Maven setup complete."
