<#
.SYNOPSIS
    Generate a Markdown repository dump (repo_dump.md) with:
      - Project tree
      - File contents for filtered files

.DESCRIPTION
    Starts from the directory where this script is located (project root).
    Applies filters to decide which files are included, then:
      1. Builds a project tree section.
      2. Dumps the content of each included file as fenced code blocks.
#>

[CmdletBinding()]
param(
    # Output Markdown file name (relative to project root)
    [string]$OutputFile = "repo_dump.md",

    # Directory names to exclude anywhere in the path
    [string[]]$ExcludeDirs = @(
        "ui"
        ".git",
        "node_modules",
        "__pycache__",
        ".pytest_cache",
        ".venv",
        "dist",
        "build",
        "out",
        "coverage",
        ".idea",
        ".vscode",
        "venv",
        "btv.egg-info",
        "data"
    ),

    # File extensions to include (lowercase, with leading dot)
    [string[]]$IncludeExtensions = @(
    
        ".py",
        ".md",
        ".yml",
        ".yaml"
    ),

    # File names that must always be included, regardless of extension
    [string[]]$IncludeFiles = @(
       # "README.md",
        "LICENSE",
        "pyproject.toml",
        "package.json",
        "requirements.txt"
    ),

    # File name suffixes to exclude (e.g. tests, minified files)
    [string[]]$ExcludeSuffixes = @(
        "_test.py",
        ".spec.ts",
        ".test.ts",
        ".test.js",
        ".min.js",
        ".json"
    )
)

# -------------------------
# Helper: get project root
# -------------------------

# Script directory = project root
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    # Fallback: current directory if $PSScriptRoot is not set
    $projectRoot = Get-Location
}

$projectRoot = (Resolve-Path -LiteralPath $projectRoot).Path
Write-Host "Project root: $projectRoot"

# ------------------------------------------
# Helper: normalize relative path as a/b/c
# ------------------------------------------
function Get-RelativePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FullPath
    )

    $relative = Resolve-Path -LiteralPath $FullPath -Relative

    # Remove leading .\ or ./ if present
    $relative = $relative -replace '^[.][\\/]', ''

    # Normalize separators to forward slashes
    $relative = $relative -replace '\\', '/'

    return $relative
}

# ------------------------------------------
# Helper: get language hint from extension
# ------------------------------------------
function Get-LanguageHint {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Extension
    )

    $ext = $Extension.ToLowerInvariant()

    $map = @{
        ".ps1"  = "powershell"
        ".psm1" = "powershell"
        ".psd1" = "powershell"
        ".py"   = "python"
        ".cs"   = "csharp"
        ".ts"   = "typescript"
        ".tsx"  = "tsx"
        ".js"   = "javascript"
        ".jsx"  = "jsx"
        ".json" = "json"
        ".md"   = "markdown"
        ".yml"  = "yaml"
        ".yaml" = "yaml"
        ".sh"   = "bash"
        ".bat"  = "bat"
        ".txt"  = ""
    }

    if ($map.ContainsKey($ext)) {
        return $map[$ext]
    }

    return ""
}

# ------------------------------------------
# Collect files that pass the filters
# ------------------------------------------

Write-Host "Scanning files (applying filters)..."

$filesRaw = Get-ChildItem -Path $projectRoot -Recurse -File -Force
$collected = @()

foreach ($file in $filesRaw) {
    # Skip the output file itself
    if ($file.Name -ieq $OutputFile) {
        continue
    }

    $fullPath  = $file.FullName
    $relative  = Get-RelativePath -FullPath $fullPath
    $fileName  = $file.Name
    $extension = [System.IO.Path]::GetExtension($fileName)

    # 1) Directory exclusion
    $segments = $relative -split '/'
    $skipDir = $false
    foreach ($segment in $segments) {
        if ($ExcludeDirs -contains $segment) {
            $skipDir = $true
            break
        }
    }
    if ($skipDir) { continue }

    # 2) File suffix exclusion
    $skipSuffix = $false
    $nameLower = $fileName.ToLowerInvariant()
    foreach ($suffix in $ExcludeSuffixes) {
        if ($nameLower.EndsWith($suffix.ToLowerInvariant())) {
            $skipSuffix = $true
            break
        }
    }
    if ($skipSuffix) { continue }

    # 3) Include logic
    $include = $false

    if ($IncludeFiles -contains $fileName) {
        $include = $true
    }
    elseif ($IncludeExtensions -and ($IncludeExtensions -contains $extension.ToLowerInvariant())) {
        $include = $true
    }

    if (-not $include) { continue }

    $collected += [PSCustomObject]@{
        FileInfo     = $file
        RelativePath = $relative
    }
}

$files = $collected | Sort-Object RelativePath

if (-not $files -or $files.Count -eq 0) {
    Write-Warning "No files matched the filters. Nothing to write."
    return
}

Write-Host "Included file count: $($files.Count)"

# ------------------------------------------
# Build Markdown content
# ------------------------------------------

$lines = New-Object System.Collections.Generic.List[string]

# Header
$dateStr   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$rootName  = Split-Path -Path $projectRoot -Leaf
$lines.Add("# Repository Dump")
$lines.Add("")
$lines.Add("Generated on $dateStr from root `$rootName`.")
$lines.Add("")

# --------------------
# Project Tree section
# --------------------
$lines.Add("## Project Tree")
$lines.Add("")

$seenDirs = New-Object 'System.Collections.Generic.HashSet[string]'

foreach ($item in $files) {
    $relPath = $item.RelativePath
    $parts   = $relPath -split '/'
    $depth   = $parts.Length

    # Directories (all segments except last, which is the file)
    $pathSoFar = ""
    for ($i = 0; $i -lt $depth - 1; $i++) {
        if ($pathSoFar) {
            $pathSoFar = "$pathSoFar/$($parts[$i])"
        }
        else {
            $pathSoFar = $parts[$i]
        }

        if (-not $seenDirs.Contains($pathSoFar)) {
            $null = $seenDirs.Add($pathSoFar)

            $indent = "  " * $i
            $folderName = $parts[$i]
            $lines.Add("$indent- **$folderName/**")
        }
    }

    # File line
    $fileIndent = "  " * ($depth - 1)
    $lines.Add("$fileIndent- $relPath")
}

$lines.Add("")
$lines.Add("---")
$lines.Add("")
$lines.Add("## File Contents")
$lines.Add("")

# --------------------
# File Contents section
# --------------------
foreach ($item in $files) {
    $fileInfo  = $item.FileInfo
    $relPath   = $item.RelativePath
    $extension = [System.IO.Path]::GetExtension($fileInfo.Name)
    $langHint  = Get-LanguageHint -Extension $extension

    # Heading with relative path (backticks around path)
    $lines.Add('### `' + $relPath + '`')
    $lines.Add("")

    # Opening fenced code block
    if ([string]::IsNullOrWhiteSpace($langHint)) {
        $lines.Add('```')
    }
    else {
        $lines.Add('```' + $langHint)
    }

    # File content as one big string; do NOT mess with backticks/newlines
    try {
        $content = Get-Content -LiteralPath $fileInfo.FullName -Raw -ErrorAction Stop
        if ($null -ne $content -and $content -ne "") {
            # Split on actual newlines so WriteAllLines gets clean lines
            $contentLines = $content -split "`n"
            foreach ($line in $contentLines) {
                # Trim trailing `r if present
                $lines.Add($line.TrimEnd("`r"))
            }
        }
    }
    catch {
        $lines.Add("<!-- Error reading file: $($_.Exception.Message) -->")
    }

    # Closing fenced code block
    $lines.Add('```')
    $lines.Add("")
}

# ------------------------------------------
# Write to repo_dump.md in project root
# ------------------------------------------

$outputPath = Join-Path -Path $projectRoot -ChildPath $OutputFile
Write-Host "Writing Markdown to: $outputPath"

[System.IO.File]::WriteAllLines($outputPath, $lines)

Write-Host "Done."
