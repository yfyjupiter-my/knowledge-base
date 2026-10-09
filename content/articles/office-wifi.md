---
title: Can't Connect to Office Wi-Fi
summary: What to do when office Wi-Fi doesn't appear, rejects a correct password, or connects without internet access — for Windows, macOS and phones.
category: network
tags: [Wi-Fi, wireless, 802.1X, DHCP, office network]
updated: 2026-09-25
---

The office provides the following wireless networks:

| Network name (SSID) | Purpose | Authentication |
| --- | --- | --- |
| `Corp-Office` | Company laptops | Domain account (802.1X) |
| `Corp-Mobile` | Employee phones / tablets | Domain account (802.1X) |
| `Corp-Guest` | Visitors | Temporary password from reception |

> [!NOTE]
> `Corp-Office` only accepts domain-joined company computers. Use `Corp-Mobile` for personal laptops and `Corp-Guest` for visitors.

## 1. The office Wi-Fi doesn't appear

- [ ] Make sure wireless is on and airplane mode is off (some laptops have a hardware shortcut such as `Fn + F2`)
- [ ] Make sure you're inside the office area — signal may be weak in meeting rooms and pantries
- [ ] Ask colleagues nearby whether they can see the network. If nobody can, contact IT directly (an access point may be down)

## 2. "Can't connect to this network"

- [ ] **Forget** the network in your Wi-Fi list, then connect again
- [ ] Enter your domain account as the username (e.g. `jsmith`) — **without** an `@` suffix
- [ ] When prompted to trust a certificate, check that the issuer is `Corp Root CA`, then choose "Connect"
- [ ] If you changed your domain password recently, make sure every device has the new password

> [!CAUTION]
> Devices with an old saved password keep retrying automatically. **5 consecutive** failed sign-ins lock your domain account for 30 minutes, which also blocks email and VPN sign-in.

On Windows you can also forget the network from the command line:

```powershell
netsh wlan show profiles
netsh wlan delete profile name="Corp-Office"
```

## 3. Connected but no internet

- [ ] Check that you received a valid IP: it should start with `10.`. A `169.254.x.x` address means no address was assigned
- [ ] Run the commands below to renew your IP address
- [ ] Check whether a static IP or DNS was set manually; if so, switch back to "Obtain automatically"
- [ ] Disable the system proxy or any proxy app and try again

```powershell
ipconfig /release
ipconfig /renew
ipconfig /all
```

> [!TIP]
> On macOS, go to System Settings → Network → Wi-Fi → Details → TCP/IP and click **Renew DHCP Lease**.

## 4. Slow or dropping connection

- [ ] Move closer to an access point (the white disc on the ceiling) and test again
- [ ] Prefer the 5 GHz band in your Wi-Fi settings
- [ ] Update your wireless driver (one click via the company Software Center)

## Still not working?

Contact the IT Service Desk with: your floor and desk number, device type, when the problem started, and a screenshot of `ipconfig /all`.
