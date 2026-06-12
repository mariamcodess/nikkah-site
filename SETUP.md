# Mariam & Umar Nikkah Site Setup

## Recommended Setup

Use:

- Vercel for hosting
- Google Sheets for RSVP tracking
- GitHub for future edits and automatic redeploys

Guests will visit the Vercel link, enter the guest password, confirm their RSVP, and the RSVP will be saved into your Google Sheet.

## Can You Keep Updating the Site?

Yes. The best workflow is:

1. Edit the files in this site folder.
2. Commit/push the changes to GitHub.
3. Vercel automatically rebuilds and updates the live website.

If you connect a custom domain later, the same link/domain stays live while updates deploy behind the scenes.

## Google Sheets RSVP Setup

1. Create a new Google Sheet.
2. You can name it something like `Mariam & Umar Nikkah RSVPs`.
3. Open `Extensions > Apps Script`.
4. Paste the code from `google-sheets-apps-script.js`.
5. Click `Deploy > New deployment`.
6. Select type: `Web app`.
7. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`
8. Click `Deploy`.
9. Approve the permissions.
10. Copy the Web App URL.

The script will automatically create a tab named `RSVPs` and add these headers:

```text
Submitted At | Full Name | Email | Phone | Attendance
```

## Vercel Environment Variables

Add these in Vercel under:

`Project > Settings > Environment Variables`

```text
SITE_PASSWORD=your-guest-password
ADMIN_PASSWORD=your-private-admin-password
GOOGLE_SHEETS_WEBHOOK_URL=your-google-apps-script-web-app-url
```

For the current local preview, the guest password is:

```text
bismillah
```

## Hosting on Vercel

1. Put this `nikkah-site` folder into a GitHub repository.
2. Go to Vercel and import that GitHub repository.
3. Set the environment variables above.
4. Deploy.
5. Test the live link:
   - Enter the guest password.
   - Confirm one test RSVP.
   - Make sure the RSVP appears in Google Sheets.

## Admin View

With Google Sheets, the Google Sheet is the admin RSVP tracker.

The custom `admin.html` page was originally for Supabase-style database viewing. For the simpler Google Sheets setup, you can use the sheet directly to sort, filter, and share RSVP responses.

## Local Preview

From inside this folder:

```bash
SITE_PASSWORD=bismillah ADMIN_PASSWORD=admin node dev-server.mjs
```

Then open:

```text
http://localhost:4174
```

Local preview lets you confirm RSVP without Google Sheets connected, so you can keep designing before launch.
