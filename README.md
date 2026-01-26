<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a5f7a,100:57c5b6&height=200&section=header&text=KGMU%20AI%20Chatbot&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Intelligent%20Campus%20Navigator%20for%20King%20George's%20Medical%20University&descSize=18&descAlignY=55" width="100%"/>
</p>

<p align="center">
  <a href="https://kgmu.org"><img src="https://img.shields.io/badge/Live%20on-KGMU.org-0056b3?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live on KGMU.org"/></a>
  <a href="https://proxyayush.github.io/KGMU_AI_Chatbot/"><img src="https://img.shields.io/badge/Demo-GitHub%20Pages-181717?style=for-the-badge&logo=github&logoColor=white" alt="Demo"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/></a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=57C5B6&center=true&vCenter=true&width=600&lines=Healthcare+Navigation+Assistant;Campus+%26+Infrastructure+Guide;24%2F7+Bilingual+Support+(English+%2B+Hindi);Built+for+Students%2C+Patients+%26+Visitors" alt="Typing SVG" />
</p>

---

## About The Developer

<p align="center">
  <img src="./your-profile-image.JPG" alt="Dr. Ayush Yadav" width="150" style="border-radius:50%"/>
</p>

<h3 align="center">Made by Dr. Ayush Yadav</h3>
<p align="center"><strong>MBBS, King George's Medical University (Batch of 2019)</strong></p>

<p align="center">
  <em>As a physician and developer, I've combined my medical knowledge with programming skills to create this KGMU Assistant. This project aims to enhance the university website's accessibility and provide seamless information access for patients, students, and faculty members.</em>
</p>

<h4 align="center">Connect with me</h4>
<p align="center">
  <a href="https://linkedin.com/in/ayush-yadav-kgmu"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://instagram.com/ayush.ism"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"/></a>
  <a href="https://x.com/ProxyAyush"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="X"/></a>
</p>

---

## What This Chatbot Does

<table>
<tr>
<td width="50%">

### 🏥 Campus Navigation
- **Departments & Buildings** - Find any department across the sprawling KGMU campus
- **Facilities & Services** - Locate OPDs, emergency services, pharmacies, canteens
- **Contact Information** - Direct phone numbers and office locations

</td>
<td width="50%">

### 🏨 Medical Infrastructure
- **Hospital Services** - Information about all hospitals under KGMU
- **Speciality Clinics** - Cardiology, Neurology, Orthopedics, and 50+ departments
- **Patient Services** - Admission process, visiting hours, documentation

</td>
</tr>
<tr>
<td width="50%">

### 📚 Academic Information
- **Courses & Programs** - MBBS, MD, MS, DM, MCh, Nursing, Paramedical
- **Admissions** - Eligibility, process, important dates
- **Research** - Publications, ongoing projects, collaborations

</td>
<td width="50%">

### 🌐 Website Navigation
- **Quick Links** - Direct links to relevant KGMU web pages
- **Downloads** - Forms, notices, results, circulars
- **Updates** - Latest news and announcements

</td>
</tr>
</table>

---

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Backend-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare"/>
  <img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
</p>

---

## Architecture
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   KGMU.org      │────▶│  Cloudflare Workers  │────▶│  Google Gemini  │
│   (Frontend)    │◀────│  (Secure API Proxy)  │◀────│  (AI Engine)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
│
▼
┌──────────────────┐
│     Firebase     │
│   (Analytics)    │
└──────────────────┘
**Security Features:**
- API keys secured via Cloudflare Workers (never exposed client-side)
- Origin-restricted requests (only `*.kgmu.org` allowed)
- Firebase security rules for data protection

---

## Features

| Feature | Description |
|---------|-------------|
| 🌍 **Bilingual Support** | Responds in both English and Hindi |
| 🧠 **Context-Aware** | Maintains conversation history for follow-up questions |
| ⚡ **Smart Responses** | Pre-defined responses for common greetings (instant) |
| ⏱️ **Rate Limiting** | 20-second cooldown to prevent API abuse |
| 📱 **Mobile Responsive** | Fully functional on all device sizes |
| 📝 **Markdown Rendering** | Supports formatted text, links, and lists |

---

## Quick Links

<p align="center">
  <a href="https://kgmu.org"><img src="https://img.shields.io/badge/KGMU%20Official-Website-0056b3?style=for-the-badge" alt="KGMU Website"/></a>
  <a href="https://proxyayush.github.io/KGMU_AI_Chatbot/"><img src="https://img.shields.io/badge/Chatbot-Demo-57c5b6?style=for-the-badge" alt="Demo"/></a>
</p>

---

## CDN Information

The chatbot is served via jsDelivr CDN on the official KGMU website:
https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
---

## CDN Cache Troubleshooting

**Setup:**
- Repo: ProxyAyush/KGMU_AI_Chatbot
- File: script6.js  
- CDN URL: https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
- Purge URL: https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js

**Steps:**
1. Verify issue (compare GitHub vs CDN content)
2. Check cache headers (age, x-cache, etag)
3. Purge multiple times (hits different edge servers)
4. Verify purge worked

For detailed instructions, see [CDN_CACHE_TROUBLESHOOTING.md](./CDN_CACHE_TROUBLESHOOTING.md)

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a5f7a,100:57c5b6&height=100&section=footer" width="100%"/>
</p>

<p align="center">
  Made with ❤️ for KGMU by <a href="https://github.com/ProxyAyush">Dr. Ayush Yadav</a>
</p>