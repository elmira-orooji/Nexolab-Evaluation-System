param(
    [switch]$ResetToken,
    [switch]$ForgetToken
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $PSScriptRoot
$secretDirectory = Join-Path $env:LOCALAPPDATA 'NexoLab'
$tokenPath = Join-Path $secretDirectory 'nexora-token.dpapi'

function ConvertFrom-SecureValue {
    param([System.Security.SecureString]$Value)
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function Get-StoredToken {
    if (-not (Test-Path -LiteralPath $tokenPath -PathType Leaf)) { return $null }
    try {
        $encrypted = [IO.File]::ReadAllText($tokenPath).Trim()
        if ([string]::IsNullOrWhiteSpace($encrypted)) { return $null }
        $secure = ConvertTo-SecureString -String $encrypted
        try {
            return ConvertFrom-SecureValue -Value $secure
        }
        finally {
            $secure.Dispose()
        }
    }
    catch {
        Write-Warning 'توکن ذخیره‌شده قابل‌بازیابی نیست؛ برای ذخیرهٔ دوباره، توکن را وارد کنید.'
        return $null
    }
}

function Save-StoredToken {
    param([Parameter(Mandatory = $true)][string]$Value)
    $secure = ConvertTo-SecureString -String $Value -AsPlainText -Force
    try {
        $encrypted = ConvertFrom-SecureString -SecureString $secure
    }
    finally {
        $secure.Dispose()
    }

    if (-not (Test-Path -LiteralPath $secretDirectory -PathType Container)) {
        New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
        $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
        $directoryAcl = New-Object System.Security.AccessControl.DirectorySecurity
        $directoryAcl.SetAccessRuleProtection($true, $false)
        $inheritance = [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
        $directoryRule = [System.Security.AccessControl.FileSystemAccessRule]::new(
            $sid,
            [System.Security.AccessControl.FileSystemRights]::FullControl,
            $inheritance,
            [System.Security.AccessControl.PropagationFlags]::None,
            [System.Security.AccessControl.AccessControlType]::Allow
        )
        [void]$directoryAcl.AddAccessRule($directoryRule)
        Set-Acl -LiteralPath $secretDirectory -AclObject $directoryAcl
    }

    [IO.File]::WriteAllText($tokenPath, $encrypted, [Text.UTF8Encoding]::new($false))
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $fileAcl = New-Object System.Security.AccessControl.FileSecurity
    $fileAcl.SetAccessRuleProtection($true, $false)
    $fileRule = [System.Security.AccessControl.FileSystemAccessRule]::new(
        $sid,
        [System.Security.AccessControl.FileSystemRights]::FullControl,
        [System.Security.AccessControl.AccessControlType]::Allow
    )
    [void]$fileAcl.AddAccessRule($fileRule)
    Set-Acl -LiteralPath $tokenPath -AclObject $fileAcl
}

if ($ForgetToken) {
    Remove-Item -LiteralPath $tokenPath -Force -ErrorAction SilentlyContinue
    Write-Host 'توکن ذخیره‌شده حذف شد.'
    exit 0
}

$token = $null
if (-not $ResetToken) { $token = Get-StoredToken }
if ([string]::IsNullOrWhiteSpace($token)) {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'NexoLab | اتصال به Nexora'
    $form.Size = New-Object System.Drawing.Size(540, 230)
    $form.StartPosition = 'CenterScreen'
    $form.TopMost = $true
    $form.RightToLeft = 'Yes'
    $form.RightToLeftLayout = $true

    $label = New-Object System.Windows.Forms.Label
    $label.Text = 'توکن Bearer را وارد کنید. برای اجراهای بعدی، رمزگذاری‌شده در حساب ویندوز شما ذخیره می‌شود.'
    $label.Location = New-Object System.Drawing.Point(20, 20)
    $label.Size = New-Object System.Drawing.Size(480, 42)
    $form.Controls.Add($label)

    $tokenBox = New-Object System.Windows.Forms.TextBox
    $tokenBox.Location = New-Object System.Drawing.Point(20, 70)
    $tokenBox.Size = New-Object System.Drawing.Size(480, 30)
    $tokenBox.UseSystemPasswordChar = $true
    $form.Controls.Add($tokenBox)

    $button = New-Object System.Windows.Forms.Button
    $button.Text = 'ذخیره و اجرای NexoLab'
    $button.Location = New-Object System.Drawing.Point(335, 120)
    $button.Size = New-Object System.Drawing.Size(165, 34)
    $button.Add_Click({
        if (-not [string]::IsNullOrWhiteSpace($tokenBox.Text)) {
            $script:enteredToken = $tokenBox.Text.Trim()
            $tokenBox.Clear()
            $form.Tag = 'start'
            $form.Close()
        }
    })
    $form.Controls.Add($button)
    $form.AcceptButton = $button
    $form.Add_Shown({ $tokenBox.Focus() })

    [void]$form.ShowDialog()
    if ($form.Tag -ne 'start') { exit 1 }
    $token = $script:enteredToken
    $script:enteredToken = $null
    try {
        Save-StoredToken -Value $token
    }
    catch {
        $token = $null
        [void][System.Windows.Forms.MessageBox]::Show(
            'ذخیرهٔ امن توکن انجام نشد. مسیر و دسترسی حساب ویندوز را بررسی کنید.',
            'NexoLab', 'OK', 'Error'
        )
        exit 1
    }
}

try {
    $env:NEXORA_TOKEN = $token
    Set-Location $repo
    $env:PYTHONPATH = Join-Path $repo 'src'
    & (Join-Path $repo '.venv\Scripts\python.exe') -m nexolab `
        --serve `
        --suite datasets/persian.synthetic.json `
        --config configs/nexora.local.json `
        --output runs `
        --port 8013
}
finally {
    Remove-Item Env:NEXORA_TOKEN -ErrorAction SilentlyContinue
    $token = $null
}
