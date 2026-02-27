<div align="center">
  
# 🤖 AS-ZARA-MINI  
WhatsApp Multi-Device Bot

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<img src="utils/bot_image.jpg" alt="AS-ZARA-MINI Logo" width="260">

</div>

---

## 📖 Overview

**AS-ZARA-MINI** is a powerful, lightweight WhatsApp Multi-Device bot built on the **Baileys** library. Designed for flexibility and ease of use, it allows you to create your own customized WhatsApp bot **without any cost**. The entire codebase is open‑source, giving you full control to modify, rebrand, and deploy it anywhere – whether on a VPS, cloud panel, or your local machine.

> ⚠️ **Important Disclaimer:** This is an **unofficial** bot. Using it may violate WhatsApp's Terms of Service. The developers are **not responsible** for any account restrictions or bans. Use at your own risk. See the [Legal](#-legal) section for full details.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠 Local Setup](#-local-setup)
- [☁️ Deployment Guides](#️-deployment-guides)
- [🌐 Community & Support](#-community--support)
- [📚 Commands Overview](#-commands-overview)
- [🤝 Contributing](#-contributing)
- [📝 License & Legal](#-license--legal)
- [🙏 Credits](#-credits)

---

## ✨ Features

- **100% Open Source** – No hidden code; customize everything.
- **Easy Customization** – Change bot image, prefix, name, newsletter, and more via simple commands.
- **Modular Command System** – Commands are neatly organized in the `commands/` folder.
- **Memory Optimized** – Efficient media handling with temporary file cleanup.
- **Owner Utilities** – Built‑in commands to restart, update from ZIP, and manage the bot.
- **Group Management** – Anti‑link, welcome/goodbye, anti‑tag, and more.
- **Auto Features** – Auto‑read, auto‑react, auto‑sticker, and auto‑bio.
- **Multi‑Platform Ready** – Works on Heroku, Koyeb, Render, panels, VPS, and local machines.

---

## 🚀 Quick Start

Get your bot up and running in minutes with these simple steps.

### 1. Fork the Repository

Create your own copy of **AS-ZARA-MINI** by forking on GitHub (update URL when you make repo public).

<div align="center">
  
[![Fork on GitHub](https://img.shields.io/badge/Fork%20Repository-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/new) <!-- placeholder until real repo -->

</div>

### 2. Obtain Your Session String

Use the official pair code generator:

<div align="center">
  
[![Generate Pair Code](https://img.shields.io/badge/Generate-Pair%20Code-blueviolet?style=for-the-badge)](https://as-zara.zone.id/)

</div>

After scanning, you will receive a session string starting with `AS~...`.  
Store it **securely** and **never commit it** to any public repository.

#### How to Use Your Session

- **Option 1:** Set it as env var `SESSION_ID` on hosting.
- **Option 2:** Paste into `config.js` (local only, never push).

```js
sessionID: process.env.SESSION_ID || '',
🛠 Local Setup
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
# add SESSION_ID=AS~.... to .env
node index.js
☁️ Deployment Guides
Katabump (link missing — add real guide if available)
Heroku (general guide)
Render (general guide)
▶️ Video Tutorial
https://www.youtube.com/watch?v=Hmp17yyU9Xc
🌐 Community & Support
WhatsApp Channel: https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
WhatsApp Group: https://chat.whatsapp.com/IOEbmfzOD6d9TCjdX5Fi3B
Report Issues: GitHub Issues (once repo is public)
(remaining sections like Commands Overview, Contributing, License & Legal, Credits, Support the Developer are unchanged from your original — keep them as-is)
�
Made with ❤️ by Dex Shyam Chaudhari © 2026 DEX. All rights reserved. 
