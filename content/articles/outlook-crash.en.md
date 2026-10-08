---
title: Outlook Won't Start or Keeps Crashing
summary: Fixes for Outlook stuck on "Loading Profile", closing right after launch, or showing "Cannot start Microsoft Outlook" — including safe mode, add-ins and profile repair.
category: software
tags: [Outlook, Office, email, crash, OST]
updated: 2026-09-05
---

This guide applies to Microsoft 365 Outlook on Windows. Save any other open Office documents before you start.

> [!TIP]
> While troubleshooting, you can keep working in webmail at `https://mail.corp.example.com`.

## 1. Quick checks

- [ ] Close Outlook completely, end every `OUTLOOK.EXE` process in Task Manager, then reopen it
- [ ] Restart your computer and try again
- [ ] Make sure drive C has more than 5 GB free (the mailbox cache can be very large)

## 2. Start in safe mode

Safe mode disables all add-ins, which tells you whether a third-party add-in is the cause. Press `Win + R` and enter:

```bat
outlook.exe /safe
```

- [ ] Start Outlook in safe mode and check whether it opens normally
- [ ] If safe mode works: go to **File → Options → Add-ins → COM Add-ins → Go** and untick all add-ins
- [ ] Restart Outlook normally, then re-enable add-ins one at a time to find the culprit

> [!NOTE]
> Don't uninstall required company add-ins (such as room booking or mail archiving). Just disable them and tell IT which one is causing trouble.

## 3. Repair Office

- [ ] Open **Settings → Apps → Installed apps**, find Microsoft 365 and choose "Modify"
- [ ] Run **Quick Repair** first; if that doesn't help, run **Online Repair** (needs internet, about 20–30 minutes)

## 4. Rebuild the mailbox cache and profile

A corrupted cache file (`.ost`) is a common reason Outlook hangs on "Loading Profile". Your mail lives on the server, so deleting the cache simply triggers a fresh download.

- [ ] Close Outlook
- [ ] Run the command below to open the cache folder, then rename the `.ost` file (e.g. add `.bak` to the end)
- [ ] Reopen Outlook and wait for your mail to finish syncing

```powershell
explorer "$env:LOCALAPPDATA\Microsoft\Outlook"
```

> [!CAUTION]
> Only touch `.ost` files. A `.pst` file in that folder is a **local archive** — it can't be recovered from the server if deleted. Never delete or move `.pst` files.

If Outlook still won't start after rebuilding the cache, create a new profile:

- [ ] Open **Control Panel → Mail (Microsoft Outlook) → Show Profiles → Add**
- [ ] Enter your company email address to set it up, then select the new profile under "Always use this profile"

## Still not working?

Collect the following and contact IT: a screenshot of the full error, your Office version (**File → Office Account**), and any errors from source `Outlook` or `Application Error` under Event Viewer → Windows Logs → Application.
