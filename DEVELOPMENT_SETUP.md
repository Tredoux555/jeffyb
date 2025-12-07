# Development Setup Guide

## Email Confirmation Setup

For development, it's recommended to **disable email confirmation** so users can sign up and log in immediately without needing to verify their email.

### How to Disable Email Confirmation in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Find the **"Enable email confirmations"** toggle
4. **Turn it OFF**
5. Save changes

**Result:** Users will be automatically confirmed when they sign up, allowing immediate login.

---

## Fixing the 406 Error on User Profiles

If you're seeing a `406` error when users try to register, it's likely an RLS (Row Level Security) issue with the `user_profiles` table.

### Solution: Run the Migration SQL

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file: `migrations/migration-fix-email-confirmation-and-rls.sql`
4. Copy and paste the entire SQL script
5. Click **Run**

This will:
- Fix the RLS policies to allow profile creation during signup
- Ensure the trigger function has proper permissions
- Grant necessary permissions to authenticated and anonymous users

---

## Testing Registration

After completing the above steps:

1. **Sign up** a new user at `/auth/register`
2. If email confirmation is **disabled**: User should be automatically logged in and redirected to `/profile`
3. If email confirmation is **enabled**: User will be redirected to `/auth/verify-email` (but emails won't send unless configured)

---

## Production Setup

When ready for production:

1. **Enable email confirmations** in Supabase Dashboard
2. **Configure email provider** in Supabase:
   - Go to **Authentication** → **Email Templates**
   - Configure your email provider (SendGrid, AWS SES, etc.)
   - Or use Supabase's built-in email service (limited)

3. **Test email delivery** before going live

---

## Troubleshooting

### "406 Error" on user_profiles
- **Solution:** Run the migration SQL script (see above)

### "Email not sending"
- **Check:** Is email confirmation enabled in Supabase?
- **If enabled:** Configure an email provider in Supabase Dashboard
- **If disabled:** Users are auto-confirmed, no email needed

### "User can't log in after signup"
- **Check:** Is email confirmation enabled?
- **If yes:** User must click the confirmation link in their email
- **If no:** User should be auto-logged in after signup

---

## Quick Reference

| Setting | Development | Production |
|---------|------------|------------|
| Email Confirmation | **OFF** | **ON** |
| Email Provider | Not needed | Configured |
| RLS Policies | Fixed via migration | Same migration |

