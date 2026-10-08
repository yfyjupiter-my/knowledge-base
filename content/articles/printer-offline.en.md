---
title: Printer Offline or Not Printing
summary: How to fix an office network printer that shows "Offline", jobs stuck in the queue, garbled output, or a printer that can't be found.
category: hardware
tags: [printer, offline, print queue, driver, scanning]
updated: 2026-07-22
---

The multifunction printers on each floor are managed by the print server `print.corp.example.com` and named by floor, e.g. `PRN-3F-East`.

## 1. Check the printer itself

- [ ] Make sure the printer is on and the panel shows no paper jam, empty tray or low toner warning
- [ ] Ask a colleague to print something to tell whether it's a **printer fault** or a **problem with your PC**
- [ ] If the panel reports a jam, follow the on-screen animation to open the right door and remove the paper

> [!WARNING]
> The fuser area gets very hot — don't touch parts marked with a heat warning. If paper is jammed deep inside, don't force it; contact Facilities or IT.

## 2. Clear a stuck print queue

- [ ] Open **Settings → Bluetooth & devices → Printers & scanners**, select the printer → **Open print queue**
- [ ] Cancel every job in the queue
- [ ] If jobs won't cancel, open PowerShell **as administrator** and run the commands below to restart the print service

```powershell
Stop-Service -Name Spooler -Force
Remove-Item "$env:SystemRoot\System32\spool\PRINTERS\*" -Force
Start-Service -Name Spooler
```

## 3. Printer shows "Offline"

- [ ] Make sure you're on the company network (guest Wi-Fi can't reach printers)
- [ ] In the print queue window's "Printer" menu, untick **Use Printer Offline**
- [ ] Run the command below to check connectivity to the print server

```powershell
Test-NetConnection print.corp.example.com -Port 445
```

> [!TIP]
> If `TcpTestSucceeded` is `False`, your network can't reach the print server. Work through "Can't Connect to Office Wi-Fi" first.

## 4. Re-add the printer

- [ ] Remove the current printer device
- [ ] Press `Win + R`, enter `\\print.corp.example.com`, and double-click your floor's printer to install the driver automatically
- [ ] Print a test page to confirm it works

## 5. Garbled output or broken formatting

- [ ] Save the document as PDF and print that instead
- [ ] In printer properties, switch the driver to the generic **PCL6** driver

## Reporting a fault

Include in your ticket: the printer name (on the front of the device), any error code shown on the panel, and when the problem started.
