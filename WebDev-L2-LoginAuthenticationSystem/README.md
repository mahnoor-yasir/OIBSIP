# Secure Login – Enterprise Authentication Platform

A modern, high-performance, frontend-only enterprise authentication and user dashboard platform built with pure HTML5, CSS3, and JavaScript. 

It provides an end-to-end simulation of production-grade identity management, featuring secure password hashing, One-Time Password (OTP) verification, session management, social OAuth login flows, custom theme engines, and interactive security analytics.

---

## Key Features

### 🔐 Authentication & Identity Management
* **Native SHA-256 Encryption:** Secure, client-side password hashing using the Web Crypto API (`crypto.subtle`).
* **Interactive OTP Verification:** Built-in **Developer Mailbox** to simulate email verification and password reset workflows via 6-digit OTP codes.
* **Social Sign-In Simulation:** Seamless client-side OAuth sign-in simulation for Google and GitHub.
* **Brute-Force Protection:** Automated account locking after 5 consecutive failed login attempts (with a 5-minute lockout timer).
* **Password Governance:** Real-time password strength meter, rule checking, and password reuse prevention (tracking up to 5 historical hashes).

### 📊 Dashboard & Security Analytics
* **Security Score Engine:** Real-time dynamic security score calculation based on verification status, 2FA settings, profile completeness, and password age.
* **Device & Session Intelligence:** Tracks mock user agent info, IP address, device types, and location metadata.
* **Visual Data Insights:**
  * 7-day interactive login frequency bar chart.
  * Device breakdown donut chart.
  * 7-day x 24-hour activity heatmaps.
  * Filterable audit/activity logs.

### 🎨 Customization & User Controls
* **Theme Engine:** Instant switching between Dark and Light mode.
* **Accent Customization:** Dynamic theme accents (Indigo, Violet, Pink, Emerald, Amber).
* **Command Palette (`⌘K` / `Ctrl+K`):** Quick navigation palette to execute actions anywhere within the app.
* **Profile & Settings:** Edit user information, upload avatars, toggle notifications, and adjust session timeout parameters.

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox, Grid, Glassmorphism design system)
* **Scripting:** Modern JavaScript (ES6+ / Web APIs)
* **Encryption:** Web Crypto API (`SHA-256`)
* **Storage Layer:** LocalStorage & SessionStorage engines (`nexora_db_v1`, `nexora_session_v1`)
* **Typography & Icons:** Inter (Google Fonts), Custom SVG Vector Icons

---

## 🚀 Getting Started

Since **Secure Login** is entirely client-side, no node modules or server setups are required.

### 1. Run Locally
1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (works seamlessly via file system `file://` or local servers like Live Server).

### 2. Testing the Flows
* **Registration & OTP:** Register a new user and retrieve your 6-digit OTP code directly from the on-screen **Developer Mailbox**.
* **Social OAuth:** Click on **Google** or **GitHub** buttons to test immediate simulated OAuth flows.
* **Lockout Testing:** Enter wrong passwords 5 times to observe the security lockout layer.
* **Command Palette:** Press `⌘K` (Mac) or `Ctrl+K` (Windows) to bring up the quick action command menu.

---

## 📂 Project Structure

```text
├── index.html        # App shell container, metadata, and SVG favicon
├── style.css         # Enterprise design system, themes, and UI styles
└── script.js        # Core engine: Crypto, DB layer, Router, Auth flows, & Views
