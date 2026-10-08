---
title: VPN Connection Troubleshooting Guide
summary: Step-by-step fixes for when the VPN client won't connect, keeps dropping, or connects but internal systems are unreachable while working from home or travelling.
category: network
tags: [VPN, remote work, intranet, certificate, 809]
updated: 2026-09-18
---

This guide covers the company-issued VPN client (Windows / macOS). Work through the steps **in order** and tick each one off as you go — your progress is saved automatically in this browser.

> [!IMPORTANT]
> Do not install third-party VPNs or "accelerators" from unknown sources. They conflict with the company VPN and may violate the information security policy.

## 1. Confirm basic connectivity

- [ ] Open any external website (e.g. `https://www.bing.com`) to confirm you are online
- [ ] On hotel, airport or other public Wi-Fi, complete the **captive portal sign-in** in your browser first
- [ ] Try your phone's hotspot to rule out the current network blocking VPN ports

> [!TIP]
> Some hotel and guest networks block UDP ports. If the hotspot works but the current network doesn't, it's almost certainly a network restriction — switch the client to **TCP / 443 mode** in its settings.

## 2. Check the client and your account

- [ ] Make sure the VPN client is up to date (Help → Check for updates). Versions older than 5.2 are no longer supported
- [ ] Sign in with your **domain account** (e.g. `jsmith`), not your email address
- [ ] Make sure your domain password hasn't expired — try signing in to webmail to verify
- [ ] Make sure the clock on your phone's MFA authenticator is synced (a drift of more than 30 seconds invalidates codes)

## 3. Handle specific error codes

| Error code | Meaning | What to do |
| --- | --- | --- |
| 809 | Network is blocking VPN traffic | Switch networks or use TCP/443 mode |
| 691 | Wrong username or password | Check your domain account, reset password |
| 812 | Account has no VPN permission | Request "Remote Access" in the OA system |
| 13801 | Invalid or expired certificate | Check the system clock; if it persists, ask IT to reissue the certificate |

## 4. Reset local network components

If nothing above helps, reset your network configuration. On Windows, open PowerShell **as administrator** and run:

```powershell
ipconfig /flushdns
netsh winsock reset
netsh int ip reset
```

On macOS, run in Terminal:

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

- [ ] Run the reset commands and **restart your computer**
- [ ] After restarting, open the VPN client and connect again

> [!WARNING]
> `netsh winsock reset` resets custom settings on every network adapter (such as manually configured IPs and proxies). Make sure you don't need to keep any special configuration before running it.

## 5. Connected but can't reach internal systems

- [ ] Run `Test-NetConnection oa.corp.example.com -Port 443` in PowerShell and confirm `TcpTestSucceeded` is `True`
- [ ] Disable browser proxy extensions or the system proxy, then try again
- [ ] Check whether another VPN / proxy app is running, and quit it completely

## Still not working?

Submit an IT ticket with screenshots of: the client version, the full error message, your network type (home broadband / public Wi-Fi / mobile hotspot) and the steps you have completed.
