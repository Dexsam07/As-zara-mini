<div align="center">
  
# 🤖 AS-ZARA-MINI  
WhatsApp Multi-Device Bot

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/network/members)

<img src="utils/bot_image.jpg" alt="AS-ZARA-MINI Logo" width="260">

</div>

---

## 📖 Overview

**AS-ZARA-MINI** is a powerful, lightweight WhatsApp Multi-Device bot built on the **Baileys** library. Designed for flexibility and ease of use, it allows you to create your own customized WhatsApp bot **without any cost**. The entire codebase is open-source, giving you full control to modify, rebrand, and deploy it anywhere – whether on a VPS, cloud panel, or your local machine.

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
- **Owner Utilities** – Built-in commands to restart, update from ZIP, and manage the bot.
- **Group Management** – Anti-link, welcome/goodbye, anti-tag, and more.
- **Auto Features** – Auto-read, auto-react, auto-sticker, and auto-bio.
- **Multi-Platform Ready** – Works on Heroku, Koyeb, Render, panels, VPS, and local machines.

---

## 🚀 Quick Start

Get your bot up and running in minutes with these simple steps.

### 1. Fork the Repository

<div align="center">
  
[![Fork on GitHub](https://img.shields.io/badge/Fork%20Repository-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Dexsam07/As-zara-mini/fork)

</div>

### 2. Obtain Your Session String

Use the official pair code generator:

<div align="center">
  
[![Generate Pair Code](https://img.shields.io/badge/Generate-Pair%20Code-blueviolet?style=for-the-badge)](https://as-zara.zone.id/)

</div>

After scanning, you will receive a session string starting with `AS~...`.  
Store it **securely** and **never commit it** to any public repository.

Paste into `config.js` or set as env var `SESSION_ID`.

---

## 🛠 Local Setup

Prerequisites: Node.js 18+, Git, WhatsApp account.

``bash
git clone https://github.com/Dexsam07/As-zara-mini.git
cd As-zara-mini
npm install
# Add SESSION_ID=AS~... to .env or edit config.js
node index.js
QR scan appears if no session.
☁️ Deployment Guides
Katabump Panel: Dashboard Login → Deploy (upload your repo zip or git)
Heroku: Create New App → Connect GitHub repo
Render: New → Web Service → Connect GitHub repo
Video Tutorial: Watch on YouTube
🌐 Community & Support
WhatsApp Channel: Join Here
WhatsApp Group (if any): Join Group
Report Issues: GitHub Issues
📚 Commands Overview
Type .menu in chat for full list.
Category
Commands
Description
General
.menu, .ping, .runtime
Bot info and status
Sticker
.sticker, .toimage, .emoji
Create stickers from media
Download
.ytmp3, .ytmp4, .tiktok
Download from YouTube/TikTok
Group
.antilink, .welcome, .tagall
Group management tools
Owner
.restart, .update, .setpp
Bot control and customization
All configurable in config.js and commands/ folder.
🤝 Contributing
Fork the repo
Create branch: git checkout -b feature/amazing-feature
Commit: git commit -m 'Add amazing feature'
Push: git push origin feature/amazing-feature
Open Pull Request
Follow existing style.
📝 License & Legal
MIT License – see LICENSE file.
Warning:
For educational/experimental use only.
Not affiliated with WhatsApp.
Risk of ban if misused (spam, bulk messaging, harassment).
Use responsibly.
🙏 Credits
Dex Shyam Chaudhari – Main developer
Baileys – Core library
Open-source deps in package.json
☕ Support the Developer
Consider supporting the project!
�

Support Here
�
￼
�

�
Made with ❤️ by Dex Shyam Chaudhari © 2026 DEX. All rights reserved. 
