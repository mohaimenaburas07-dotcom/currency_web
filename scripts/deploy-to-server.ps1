# scripts/deploy-to-server.ps1
# Usage: .\scripts\deploy-to-server.ps1 -ServerIp "10.10.30.10"

param (
    [string]$ServerIp = "10.10.30.10",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/opt/alwaha"
)

$ErrorActionPreference = "Stop"

# 1. Build Backend
Write-Host "--- Building Spring Boot Backend ---" -ForegroundColor Cyan
Set-Location "d:\BankTest\Al-waha\springboot-backend"
mvn clean package -DskipTests

# 2. Build Frontend
Write-Host "--- Building Next.js Frontend ---" -ForegroundColor Cyan
Set-Location "d:\currency_web"
npm run build

# 3. Create Deployment Package (Standalone Mode)
Write-Host "--- Preparing Standalone Deployment Package ---" -ForegroundColor Cyan
$DeployDir = "d:\currency_web\deploy_package"
if (Test-Path $DeployDir) { Remove-Item -Recurse -Force $DeployDir }
New-Item -ItemType Directory -Path $DeployDir

# Copy Backend JAR
Copy-Item "d:\BankTest\Al-waha\springboot-backend\target\backend-0.0.1-SNAPSHOT.jar" -Destination "$DeployDir\backend.jar"

# Prepare Frontend Standalone
New-Item -ItemType Directory -Path "$DeployDir\frontend"
if (Test-Path ".next\standalone") {
    Copy-Item -Recurse ".next\standalone\*" -Destination "$DeployDir\frontend"
    # Next.js standalone needs static and public copied manually
    New-Item -ItemType Directory -Path "$DeployDir\frontend\.next\static"
    Copy-Item -Recurse ".next\static\*" -Destination "$DeployDir\frontend\.next\static"
    Copy-Item -Recurse "public" -Destination "$DeployDir\frontend\public"
} else {
    Write-Error "Standalone build not found! Ensure 'output: standalone' is in next.config.mjs"
}

# If you downloaded the node linux binary, copy it too
if (Test-Path "node-v20.12.2-linux-x64.tar.xz") {
    Copy-Item "node-v20.12.2-linux-x64.tar.xz" -Destination "$DeployDir\node-linux.tar.xz"
}

# If you downloaded the java linux binary, copy it too
if (Test-Path "java-linux.tar.gz") {
    Copy-Item "java-linux.tar.gz" -Destination "$DeployDir\java-linux.tar.gz"
}

# 4. Transfer to Server
Write-Host "--- Transferring to Server ($ServerIp) ---" -ForegroundColor Cyan
ssh "${ServerUser}@${ServerIp}" "mkdir -p ${RemotePath}"
scp -r "$DeployDir\*" "${ServerUser}@${ServerIp}:${RemotePath}/"

# 5. Remote Setup & Start
Write-Host "--- Starting Services on Server ---" -ForegroundColor Cyan
$RemoteScript = @'
cd /opt/alwaha

# 1. Extract Node.js if not already done
if [ -f "node-linux.tar.xz" ]; then
    echo "Ensuring Node.js engine is extracted..."
    mkdir -p node-v20.12.2-linux-x64
    tar -xf node-linux.tar.xz --strip-components=1 -C node-v20.12.2-linux-x64 >/dev/null 2>&1 || true
fi

# 2. Extract Java if not already done
if [ -f "java-linux.tar.gz" ]; then
    echo "Ensuring Java engine is extracted..."
    mkdir -p java-17
    tar -xf java-linux.tar.gz --strip-components=1 -C java-17 >/dev/null 2>&1 || true
fi

# Define absolute paths
NODE_BIN=/opt/alwaha/node-v20.12.2-linux-x64/bin/node
if [ -d "/opt/alwaha/java-17/bin" ]; then
    JAVA_BIN=/opt/alwaha/java-17/bin/java
else
    JAVA_BIN=$(command -v java || echo "java")
fi

# 3. Start Services
cd frontend
fuser -k 3000/tcp || true
fuser -k 8080/tcp || true

# Set HOSTNAME=0.0.0.0 to fix IPv6 bind errors
HOSTNAME=0.0.0.0 PORT=3000 nohup $NODE_BIN server.js > frontend.log 2>&1 &
nohup $JAVA_BIN -jar /opt/alwaha/backend.jar > /opt/alwaha/backend.log 2>&1 &

echo '✅ Startup commands issued (with offline Java and IPv4 fix).'
'@

$RemoteScript | ssh "${ServerUser}@${ServerIp}" "bash"

Write-Host "✅ Deployment Complete (Standalone)!" -ForegroundColor Green
