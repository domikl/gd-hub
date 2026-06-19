# Graphic Design Priority Hub

A web application with a persistent Node.js backend for prioritizing graphic design requests exported from a Microsoft List.

The app follows the GIZ Albania graphic design request workflow brief. It ranks list items with the documented scoring model:

`Urgency Score + Strategic Score + Visibility Score + Political Score + Deadline Risk Score - Completeness Penalty - Complexity Penalty`

It includes a CSV importer for Microsoft List exports that include a `ListSchema=` first line, an Entry tab with live Priority Level calculation, workflow status filtering, scoring-rule reference cards, Microsoft Graph connection notes, and CSV export for sharing or updating list columns such as `Priority Score` and `Priority Level`.

Run locally:

```powershell
node server.js
```

Then open `http://127.0.0.1:4173/`.

The server stores entries in `data/entries.json` (created automatically and excluded from Git). Entry submissions, CSV imports, and edits from the List tab are written through the API. The Export CSV button downloads the current server dataset.

API endpoints:

- `GET /api/entries` - list saved entries
- `POST /api/entries` - create an entry
- `PATCH /api/entries/:id` - save List edits
- `POST /api/entries/import` - import or replace entries
- `GET /api/entries/export.csv` - export all saved entries
- `GET /api/health` - backend health check

Expected list columns include `Title`, `Project Name`, `Project Number`, `Contact Person`, `Approval Owner`, `Donor / Partner`, `Request`, `Design Type`, `Requested Delivery Date`, `EU visibility required`, `Partner logos required?`, `Language requirements`, `Confrim Attached Content `, `Delivered`, `Attachments`, `Urgency Level`, `Visibility Sensitivity`, `Political Sensitivity`, `Content Status`, `Source Files Status`, `Estimated Complexity`, `Design Status`, `Strategic Importance`, and `Deadline Risk`.

For production, deploy the Node server together with the frontend so the API and persistent store remain available. The Connect tab documents the optional Microsoft Graph mapping for a future SharePoint integration.
