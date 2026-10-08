---
title: Domain Account Locked or Password Expired
summary: Self-service unlock and reset when you see "account locked" or "password expired" signing in to your PC, email or OA — and how to find the device that keeps locking you out.
category: account
tags: [domain account, password reset, account lockout, MFA, self-service]
updated: 2026-08-30
---

Your company domain account signs you in to your PC, email, VPN, Wi-Fi, the OA system and more. For security, the account policy is:

- Passwords expire every **90 days**; email reminders start 14 days before
- **5 consecutive** wrong passwords lock the account for **30 minutes**
- New passwords need at least 12 characters, including three of: uppercase, lowercase, digits; and can't match your last 5 passwords

## 1. Self-service unlock / reset

- [ ] Open the self-service portal `https://passwd.corp.example.com` in your phone's browser (no company network needed)
- [ ] Enter your domain account and complete MFA (authenticator app or SMS)
- [ ] Choose "Unlock account", or "Reset password" if you've forgotten it
- [ ] Wait about **5 minutes** for the change to sync to all systems before signing in

> [!NOTE]
> You must have registered a phone number before using the portal for the first time. If you never did, bring your badge to the IT Service Desk.

## 2. Update every device after a password change

After a password change, **every device that saved your old password keeps trying it** — the most common cause of repeated lockouts.

- [ ] Phone: mail app, Teams / WeCom, `Corp-Mobile` Wi-Fi
- [ ] Computer: Outlook, mapped network drives, credentials saved in the VPN client
- [ ] Other: tablets, home computers signed in to company accounts

On Windows, list and clear saved credentials with:

```powershell
# List saved credentials
cmdkey /list

# Delete a credential (replace the target with a name from the list above)
cmdkey /delete:TERMSRV/fileserver.corp.example.com
```

> [!WARNING]
> Never write your password on sticky notes, shared documents or chats. IT staff will **never** ask for your password by phone, email or chat — report any such request to Information Security immediately.

## 3. Account keeps getting locked

- [ ] Check the lockout source on the portal's "Sign-in history" page (it shows a device name or IP)
- [ ] Find that device and update or remove the old saved password
- [ ] If the source is an unknown device or location, **change your password immediately** and contact Information Security

## 4. Need access to a new system

Lockouts and permissions are different things. If you can sign in but see "access denied", submit an **IT Services → Access Request** in the OA system. Your manager and the system owner approve it, usually within 1 business day.
