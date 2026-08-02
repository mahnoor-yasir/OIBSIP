# Secure Login – Enterprise Authentication Platform

A modern, high-performance enterprise authentication and user dashboard platform built with HTML5, CSS3, and JavaScript, following clean coding standards and modular architecture.

---

## Technical Overview

The Secure Login project provides a complete, client-side enterprise identity and user management interface. It simulates multi-provider authentication, secure credential verification, active session management, interactive user analytics, and system administration controls.

### Key Features

* **Multi-Channel Authentication:** Supports direct account registration, simulated OTP verification via developer inbox, email/password login, and modal-based OAuth authentication (Google and GitHub).
* **Interactive Dashboard:** Dynamic metric widgets displaying overall security scores, login counts, trusted device metrics, and interactive account checklist items.
* **Granular User Analytics:** Real-time sign-in activity charts, device environment distributions, and a detailed 7-day x 24-hour activity density heatmap grid.
* **Audit & Security Management:** Comprehensive activity log table tracking explicit user events, IP addresses, geolocations, and device identifiers alongside a dedicated Security Center for password policies and 2FA toggles.
* **User Workspace Control:** Command palette modal (`Cmd + K`) for rapid keyboard navigation, notification popups, profile management, system settings, dark/light theme options, and a confirmed account deletion workflow.

---

## System Navigation & Screenshots

### Phase 1: Authentication & Onboarding Flow

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/1 Main Landing Page.png" alt="Main Landing Page" width="100%"/>
      <br/>
      <b>01. Main Landing Page</b>
      <br/>
      <i>Entry screen displaying primary choices for account creation, direct sign-in, and OAuth login.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/2 Sign Up Form.png" alt="Sign Up Form" width="100%"/>
      <br/>
      <b>02. Account Sign-Up Form</b>
      <br/>
      <i>Registration view for creating a new user account with validated credentials.</i>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/3 OTP Email Verification.png" alt="OTP Email Verification" width="100%"/>
      <br/>
      <b>03. Email OTP Verification</b>
      <br/>
      <i>Interface for verifying email address authenticity via a 6-digit confirmation code.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/4 Direct EmailPassword Sign In Page.png" alt="Direct Sign In Page" width="100%"/>
      <br/>
      <b>04. Direct Sign-In Page</b>
      <br/>
      <i>Standard authentication form for registered users entering valid email and password.</i>
    </td>
  </tr>
</table>

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/5 Sign in with Google.png" alt="Sign in with Google" width="100%"/>
      <br/>
      <b>05. Google OAuth Authentication</b>
      <br/>
      <i>Modal interface simulating single sign-on using Google credentials.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/6 Sign in with GitHub.png" alt="Sign in with GitHub" width="100%"/>
      <br/>
      <b>06. GitHub OAuth Authentication</b>
      <br/>
      <i>Modal interface simulating developer authentication using GitHub account details.</i>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="assets/images/7 Edit User Profile.png" alt="Edit User Profile" width="80%"/>
      <br/>
      <b>07. User Profile Management</b>
      <br/>
      <i>Onboarding panel allowing users to edit display name, role, bio, location, and preferred timezone.</i>
    </td>
  </tr>
</table>

---

### Phase 2: Workspace Dashboard & Navigation

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/8 Dashboard Entry.png" alt="Dashboard Entry" width="100%"/>
      <br/>
      <b>08. Initial Dashboard Entry</b>
      <br/>
      <i>Initial view following user log in, featuring dynamic welcome notifications.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/9 Main Dashboard (Dark Mode Overview).png" alt="Dark Mode Overview" width="100%"/>
      <br/>
      <b>09. Main Dashboard (Dark Mode)</b>
      <br/>
      <i>Default dark interface summarizing system status, metric counts, and primary controls.</i>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/10 Main Dashboard (Light Mode Theme).png" alt="Light Mode Dashboard" width="100%"/>
      <br/>
      <b>10. Main Dashboard (Light Mode)</b>
      <br/>
      <i>High-contrast light interface option for varied environment preference.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/11 Quick Command Palette.png" alt="Command Palette" width="100%"/>
      <br/>
      <b>11. Command Palette Navigation</b>
      <br/>
      <i>Quick search modal accessible via keyboard shortcut (Cmd + K) for rapid page traversal.</i>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="assets/images/12 Top Header Notifications Popup.png" alt="Top Header Notifications" width="80%"/>
      <br/>
      <b>12. Header Notifications Center</b>
      <br/>
      <i>Dropdown menu displaying real-time platform updates and account activity alerts.</i>
    </td>
  </tr>
</table>

---

### Phase 3: System Analytics & Audit Logging

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/13 Analytics Dashboard (Sign-in stats & charts).png" alt="Analytics Stats" width="100%"/>
      <br/>
      <b>13. Workspace Analytics Overview</b>
      <br/>
      <i>Visual reporting showing login frequency, trusted device counts, and performance metrics.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/14 Analytics (Activity Heatmap Grid).png" alt="Activity Heatmap Grid" width="100%"/>
      <br/>
      <b>14. Activity Density Heatmap</b>
      <br/>
      <i>7-day x 24-hour visual grid recording access intensity and usage spikes.</i>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="assets/images/15 Comprehensive Activity Log Table.png" alt="Comprehensive Activity Log" width="80%"/>
      <br/>
      <b>15. Comprehensive Audit Log</b>
      <br/>
      <i>Tabular view of system access attempts detailing events, IP locations, platforms, and accurate timestamps.</i>
    </td>
  </tr>
</table>

---

### Phase 4: Security, Preferences & Account Management

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/16 Security Center (2FA & Password Management).png" alt="Security Center" width="100%"/>
      <br/>
      <b>16. Security Center</b>
      <br/>
      <i>Management view for enforcing password rotation policies, multi-factor settings, and active sessions.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/17 App Settings.png" alt="App Settings" width="100%"/>
      <br/>
      <b>17. Application Preferences</b>
      <br/>
      <i>Configuration page for global theme switches, language options, notification preferences, and session timeouts.</i>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="assets/images/18 Danger Zone Panel.png" alt="Danger Zone Panel" width="100%"/>
      <br/>
      <b>18. Settings Danger Zone</b>
      <br/>
      <i>Isolated section inside workspace settings designated for irreversible administrative operations.</i>
    </td>
    <td align="center" width="50%">
      <img src="assets/images/19 Delete Account Forever.png" alt="Delete Account Confirmation" width="100%"/>
      <br/>
      <b>19. Account Removal Modal</b>
      <br/>
      <i>Final verification dialog requesting explicit confirmation prior to permanent account deletion.</i>
    </td>
  </tr>
</table>

---

## Architecture & Technology Stack

* **Frontend Framework:** Semantic HTML5 Structure
* **Styling & Layout:** Custom CSS3 (Flexbox, CSS Grid, Modern CSS Variables)
* **Scripting & DOM Handling:** Vanilla JavaScript (ES6+)
* **Asset Storage:** Standardized repository assets path (`assets/images/`)

---

## File Hierarchy

```text
WebDev-L2-LoginAuthenticationSystem/
├── assets/
│   └── images/
│       ├── 1 Main Landing Page.png
│       ├── 2 Sign Up Form.png
│       ├── 3 OTP Email Verification.png
│       ├── 4 Direct EmailPassword Sign In Page.png
│       ├── 5 Sign in with Google.png
│       ├── 6 Sign in with GitHub.png
│       ├── 7 Edit User Profile.png
│       ├── 8 Dashboard Entry.png
│       ├── 9 Main Dashboard (Dark Mode Overview).png
│       ├── 10 Main Dashboard (Light Mode Theme).png
│       ├── 11 Quick Command Palette.png
│       ├── 12 Top Header Notifications Popup.png
│       ├── 13 Analytics Dashboard (Sign-in stats & charts).png
│       ├── 14 Analytics (Activity Heatmap Grid).png
│       ├── 15 Comprehensive Activity Log Table.png
│       ├── 16 Security Center (2FA & Password Management).png
│       ├── 17 App Settings.png
│       ├── 18 Danger Zone Panel.png
│       └── 19 Delete Account Forever.png
├── index.html
├── script.js
├── style.css
└── README.md
```
---

## Author

**Mahnoor Yasir**

Oasis Infobyte Web Development Internship


