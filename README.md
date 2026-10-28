# Orange QR Code & MSurvey Hub (Standalone)

Standalone, cloud-deployed extraction of the Orange Egypt QR Code & MSurvey Generator.

---

## 🌐 Live Production Deployment

* **Live Public URL**: [https://orange-qr-hub.vercel.app](https://orange-qr-hub.vercel.app)
* **GitHub Repository**: [https://github.com/Diaasaad76/orange-qr-hub](https://github.com/Diaasaad76/orange-qr-hub)
* **Hosting**: Vercel (Next.js 16.2.6, Production)
* **Cloud Database**: Supabase PostgreSQL (`jyrrzvudzswrecuplaps`)
* **Local Development Port**: `3001` (to avoid collision with local V17 main app on `3000`)

---

## 🎯 Purpose & Features

Enables all colleagues to access a single, permanent online link to create branded Orange Egypt QR codes without running any local servers:

* **Orange MSurvey Builder**:
  * Course Attendance (V1 & V2) + Evaluation (V1 & V3 / E_NEW)
  * Pre-fills standard parameters: `Instructor`, `CourseName`, `Course_loc`, `Provider`
  * GenAI Dinootoo Session support
  * Custom Manual Base URL & Query Parameter Builder
* **Branding & Visual Customization**:
  * Orange brand presets (Orange Classic, Orange Gradient, Orange Mixed, Navy Elegant, Scan Me, Dark Mode)
  * Dot & Corner styling, custom RGB/hex colors, gradients, and logo uploads
  * **Baked Title**: Text rendered directly into the QR image/canvas so titles travel with exported files
  * Decorative frames (Orange, Gradient, Rounded, Shadow) and corner badge icons (Wifi, Email, Instagram, WhatsApp, etc.)
* **Exports**:
  * **PNG** (high-resolution rasterized canvas)
  * **SVG** (clean vector graphic)
  * **PowerPoint (PPTX)**: Single-slide and combined dual-slide (Attendance + Evaluation)
  * **Copy to Clipboard**: Image copied directly for quick pasting into slides or emails
* **Shared History & Creator Attribution**:
  * Every generated QR code is saved to a shared Supabase cloud database
  * Each entry records the creator's name (`Your Name:` header input), timestamp, and encoded URLs
  * Colleague A creates a QR code $\to$ Colleague B sees it in real-time in the Shared History list
  * Offline resilient: graceful fallback to `localStorage` if cloud network is unreachable

---

## 🛠️ Local Development

```powershell
cd "C:\Work\2026\Diaa Reports\qr-codes-standalone"
npm run dev
```

Open **`http://localhost:3001`** in your browser.

---

## ⚙️ Environment Variables (Configured in Vercel)

| Variable | Description | Value / Format |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://jyrrzvudzswrecuplaps.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public / Anon API Key | *Configured in Vercel Settings* |
| `SYNC_SECRET` | Secret token guarding `/api/qr/sync` | `diaa-qr-2026` |

---

## 🗄️ Database Schema (Supabase)

The shared storage runs on three tables in Supabase:

* `qr_history`: Stores all generated QR codes (`id`, `title`, `tab`, `data_json`, `customization_json`, `is_favorite`, `user_name`, `created_at`).
* `qr_templates`: Stores saved visual customization presets.
* `qr_surveys`: Stores custom user-defined survey configurations and parameter definitions.

---

## 🔄 Two-Way Sync with Main L&D V17 Database

Colleague activity on the public website does not touch the local V17 SQLite database directly. Instead, records are pulled safely via the export API:

1. **Export Endpoint**:
   ```
   GET https://orange-qr-hub.vercel.app/api/qr/sync?token=diaa-qr-2026
   ```
2. **Local Pull Script in V17**:
   From `C:\Work\2026\Diaa Reports\V17`, run:
   ```powershell
   python scripts/sync_online_qr.py https://orange-qr-hub.vercel.app/api/qr/sync diaa-qr-2026
   ```
   This inserts all newly generated colleague records into `ld_center.db` (`qr_history` table) without duplicates.
