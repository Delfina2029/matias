---
description: Run the Preview Server for Kitchen Builder NextJS Project
---

This workflow spins up the local development web server to preview changes. The port is strictly set to `9002` based on package configuration.

1. Start development server on port 9002:
// turbo
```bash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npm.cmd run dev
```
