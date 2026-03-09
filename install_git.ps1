# PowerShell script to install Git and set up the repository

# Download Git installer
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.40.1.windows.1/Git-2.40.1-64-bit.exe"
$installerPath = "$env:TEMP\git-installer.exe"

Write-Host "Downloading Git installer..."
Invoke-WebRequest -Uri $gitUrl -OutFile $installerPath

# Run installer silently
Write-Host "Installing Git..."
Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT /NORESTART" -Wait

# Add Git to PATH (may require restart)
$gitPath = "C:\Program Files\Git\cmd"
if (Test-Path $gitPath) {
    $env:Path += ";$gitPath"
    Write-Host "Git installed successfully!"
} else {
    Write-Host "Git installation may have failed. Please restart and try again."
    exit 1
}

# Navigate to project directory
Set-Location "c:\Users\DELL\noah-portfoilio"

# Initialize Git
git init

# Configure Git
git config --global user.name "Noah Aizeboje"
git config --global user.email "noahaizeboje@gmail.com"

# Add files
git add .

# Commit
git commit -m "Initial commit: Noah's portfolio with DevOps setup"

Write-Host "Repository initialized and committed locally."
Write-Host "Now create a GitHub repository and run the push commands manually."