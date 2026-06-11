# HSMS — Hotel Storehouse Management System

A full-stack web application for managing hotel storehouse operations including inventory tracking, goods receiving, issuance, purchasing, supplier management, reporting, and physical stock takes.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Recharts
- **Backend:** Express.js + Node.js built-in SQLite (`node:sqlite`)
- **No external database required** — uses an embedded SQLite file (`hsms.db`)

## Prerequisites

- **Node.js 22.5+** (for built-in SQLite support)

## Quick Start

```bash
# Install dependencies
npm install

# Seed the database with demo data
npm run seed

# Start both frontend and backend
npm run dev
```

Open **http://localhost:5173** in your browser.

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | General Manager |
| `jkamau` | `pass123` | Storekeeper |
| `mwambui` | `pass123` | Purchasing Officer |
| `aotieno` | `pass123` | Finance Controller |
| `bnjenga` | `pass123` | Dept Head (Kitchen) |
| `cwambui` | `pass123` | Dept Head (Housekeeping) |

## Features

### Inventory Management
- Full CRUD for 43+ seeded inventory items across 10 categories
- Real-time stock levels, bin locations, unit costs
- Filter by category, search by name/code, low-stock filter
- Perishable and controlled-item flags

### Goods Receiving (GRN)
- Create GRN against approved Purchase Orders
- Record batch numbers, expiry dates, storage conditions
- Auto-update stock levels and PO receipt status
- 3-way matching: PO → GRN → Invoice

### Goods Issuance (SRF)
- Submit Store Requisition Forms by department
- Approval workflow (Pending → Approved → Issued)
- Controlled items require dual authorization
- Automatic stock deduction on issuance

### Purchase Requisitions
- Manual creation or auto-generation from low stock alerts
- Approval routing based on value thresholds ($5,000+ requires Finance/GM)
- Suggested suppliers based on preferred status

### Purchase Orders
- Create POs to suppliers with line items
- Approval workflow (Draft → Approved)
- Track partial/full receipt status

### Reports & Analytics
- **Stock Movement Report** — all receipts and issues
- **Stock Valuation Report** — inventory value by category
- **Slow-Moving Items** — no movement in 30/60/90 days
- **Expiry Report** — items expiring within 7/14/30 days
- **Department Consumption** — usage by department
- **Variance Report** — physical vs system discrepancies
- **Supplier Performance** — POs, spend, lead times

### Physical Inventory (Stock Take)
- Full count or cycle count (by category)
- Enter physical counts, auto-compute variances
- Complete with or without inventory adjustments

### Supplier Management
- Supplier directory with contact info, lead times
- Preferred supplier flagging
- Performance tracking via reports

## Business Rules Enforced

- No issuance without approved SRF
- No purchasing without approved PR
- PRs above $5,000 require Finance Controller or GM approval
- Controlled items (alcohol, chemicals) require dual authorization
- FIFO/FEFO for perishable items
- Automatic low-stock alerts on dashboard

## Project Structure

```
store/
├── server/
│   ├── index.js          # Express server
│   ├── db.js             # SQLite schema + connection
│   ├── seed.js           # Demo data
│   └── routes/           # API endpoints
├── src/
│   ├── main.jsx          # React entry
│   ├── App.jsx           # Router config
│   ├── api.js            # API client
│   ├── context/          # Auth context
│   ├── components/       # Reusable UI components
│   └── pages/            # Page components
├── package.json
├── vite.config.js
└── tailwind.config.js
```
