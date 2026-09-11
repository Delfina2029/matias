---
description: Build the Kitchen Builder NextJS Project
---

This workflow compiles the project and prepares it for production. It uses the `npm.cmd` wrapper tailored for Windows environments to bypass Execution Policy restrictions that previously caused failures.

1. Configure environment and install dependencies:
// turbo-all
```bash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npm.cmd install
```

2. Run Typecheck and Build (ensure static analysis completes first):
```bash
npm.cmd run typecheck
npm.cmd run build
```
