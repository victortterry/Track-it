# 📦 TrackIt — Warehouse Inventory and Logistics Tracker

**TrackIt** is a modern, offline-first Progressive Web App (PWA) designed to simulate internal inventory systems used by logistics and e-commerce giants like Amazon or Flexport. Built with modern frontend and backend technologies, TrackIt provides seamless inventory control, barcode scanning, offline capabilities, and real-time sync — making it ideal for portfolio presentation or internal tooling prototypes.

---

## 📌 Project Objectives

TrackIt aims to replicate a robust Warehouse Management System (WMS) that supports:
- Streamlined inventory operations
- Real-time decision-making
- Offline resilience
- Scalable architecture

---

## 🚀 Key Features

### 🗃️ Inventory Management
- Full CRUD for managing products
- Multi-location inventory overview
- Item thresholds and low-stock warnings

### 🔍 Barcode Scanning
- Scan product barcodes using camera (WebRTC API)
- Auto-fill product details via barcode

### 🌐 Offline Support
- PWA setup with service workers
- IndexedDB caching using Dexie.js
- Syncs offline changes once back online

### 🔄 Real-Time Sync
- Supabase Realtime or Firebase listeners
- Instant updates across all connected devices

### 📥 Bulk Operations
- CSV import/export for fast onboarding
- Bulk edit tools for high-volume updates

### 📜 Audit Logs
- Track all inventory actions (add, remove, edit)
- View activity per user and item

### 🔔 Notifications
- Configurable alerts for low-stock items
- UI-based or toast notifications

### ✅ Authentication
- Secure login with Supabase auth
- Token-based session management

---

## 🧰 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Auth & DB:** Supabase / Firebase
- **Offline Storage:** Dexie.js (IndexedDB)
- **Realtime:** Supabase Realtime or Firebase
- **Barcode Scanner:** WebRTC API
- **Form Handling:** React Hook Form + Zod
- **PWA Support:** Service Workers + Manifest

---

## 🧭 Folder Structure
trackit/
├── app/ # Pages & routes (Next.js App Router)
├── components/ # Reusable components
├── lib/ # Supabase client, utilities, validators
├── public/ # Manifest, icons, etc.
├── styles/ # Tailwind config and globals
├── service-worker.ts # PWA offline logic
├── .env.local # Environment variables
└── README.md


```yaml
---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/trackit.git
cd trackit
```
2. Install dependencies
   ```bash
   npm instal
   l# or
   yarn install

3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit .env.local:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. Run locally
   ```bash
   npm run dev

Visit: http://localhost:3000

📦 Build & Deploy
```bash
npm run build
npm start
```
You can deploy to Vercel, Netlify, Firebase Hosting, or any HTTPS-enabled static server.

🧱 Future Improvements
Role-based access (admin/staff)

Admin dashboard

Report & analytics dashboard

Drag-and-drop category assignment

QR code generation for products



💼 Use Cases
Logistics and warehouse inventory

E-commerce backend tooling

Full-stack developer portfolio piece

Offline apps for resource-constrained areas


📄 License
Licensed under the MIT License.

🤝 Contributing
Contributions are welcome!

Fork this repo

Create a branch: git checkout -b new-feature

Commit your changes: git commit -m 'Add feature'

Push to your branch: git push origin new-feature

Submit a Pull Request

📬 Feedback
Open an issue or reach out on GitHub Issues for bugs, ideas, or suggestions.

Built to demonstrate real-world problem-solving with modern web tools — TrackIt is more than a template. It’s a production-grade demo.

yaml
Copy
Edit

```yaml

Let me know if you’d like badges, deployment instructions for Vercel/Netlify, or if you're using Firebase instead of Supabase so I can tweak it accordingly.
```
Author 
```
@victortterry25




