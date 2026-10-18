Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $PSScriptRoot
$form = New-Object System.Windows.Forms.Form
$form.Text = 'NexoLab | اتصال به Nexora'
$form.Size = New-Object System.Drawing.Size(540, 210)
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.RightToLeft = 'Yes'
$form.RightToLeftLayout = $true

$label = New-Object System.Windows.Forms.Label
$label.Text = 'توکن Bearer را وارد یا paste کنید. مقدار هنگام تایپ مخفی می‌ماند.'
$label.Location = New-Object System.Drawing.Point(20, 20)
$label.Size = New-Object System.Drawing.Size(480, 35)
$form.Controls.Add($label)

$tokenBox = New-Object System.Windows.Forms.TextBox
$tokenBox.Location = New-Object System.Drawing.Point(20, 65)
$tokenBox.Size = New-Object System.Drawing.Size(480, 30)
$tokenBox.UseSystemPasswordChar = $true
$form.Controls.Add($tokenBox)

$button = New-Object System.Windows.Forms.Button
$button.Text = 'اتصال و اجرای NexoLab'
$button.Location = New-Object System.Drawing.Point(335, 110)
$button.Size = New-Object System.Drawing.Size(165, 34)
$button.Add_Click({
    if (-not [string]::IsNullOrWhiteSpace($tokenBox.Text)) {
        $form.Tag = 'start'
        $form.Close()
    }
})
$form.Controls.Add($button)
$form.AcceptButton = $button
$form.Add_Shown({ $tokenBox.Focus() })

[void]$form.ShowDialog()
if ($form.Tag -ne 'start') {
    exit 1
}

$env:NEXORA_TOKEN = $tokenBox.Text
$tokenBox.Clear()
try {
    Set-Location $repo
    $env:PYTHONPATH = Join-Path $repo 'src'
    & (Join-Path $repo '.venv\Scripts\python.exe') -m nexolab `
        --serve `
        --suite datasets/persian.synthetic.json `
        --config configs/nexora.local.json `
        --output runs `
        --port 8013
} finally {
    Remove-Item Env:NEXORA_TOKEN -ErrorAction SilentlyContinue
}
