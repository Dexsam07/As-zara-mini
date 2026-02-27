<div align="center">
  
# 🤖 AS-ZARA-MINI  WhatsApp Multi-Device Bot

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/network/members)

<img src="utils/bot_image.jpg" alt="As-zara-mini Logo" width="260">

</div>

---

## 📖 Overview

**AS-ZARA-MINI** is a powerful, lightweight WhatsApp Multi-Device bot built on the **Baileys** library. Designed for flexibility and ease of use, it allows you to create your own customized WhatsApp bot **without any cost**. The entire codebase is open-source, giving you full control to modify, rebrand, and deploy it anywhere – whether on a VPS, cloud panel, or your local machine.

> ⚠️ **Disclaimer:** This is an unofficial bot. Use at your own risk. See [Legal](#-legal) section for details.

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

Get your bot up and running in minutes with these two simple steps.

### 1. Fork the Repository

Create your own copy of AS-ZARA-MINI by forking on GitHub.

<div align="center">
  
[![Fork on GitHub](https://img.shields.io/badge/Fork%20Repository-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Dexsam07/As-zara-mini/fork)

</div>

### 2. Obtain Your Session String

Use the pair code generator to get a session string. Scan the QR code with your WhatsApp **Linked Devices** and copy the resulting string.

<div align="center">
  
[![Generate Pair Code](https://img.shields.io/badge/Generate-Pair%20Code-blueviolet?style=for-the-badge)](https://as-zara.zone.id/)

</div>

Paste the session string into `config.js`:

```js
sessionID: 'AS~H4.....'
```

Or set it as the environment variable SESSION_ID on your hosting platform.

3. Deploy!

Choose your preferred hosting method below and follow the guides.

---

🛠 Local Setup

Run the bot on your own machine for development or personal use.

Prerequisites

· Node.js 18 or higher (Download)
· Git (Download)
· A WhatsApp account

Installation Steps

```bash
# Clone your forked repository
git clone https://github.com/Dexsam07/As-zara-mini.git
cd As-zara-mini

# Install dependencies
npm install

# Edit config.js with your session string and preferences
# (or leave sessionID empty to scan QR on first run)

# Start the bot
node index.js
```

If you left sessionID empty, a QR code will appear in the terminal – scan it with your WhatsApp to authenticate.

---

☁️ Deployment Guides

▶️ Deploy on Katabump (Panel)

<div align="center">

https://img.shields.io/badge/Deploy%20on-Katabump-orange?style=for-the-badge

</div>

▶️ Deploy on Heroku

https://img.shields.io/badge/Deploy%20on-Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white

▶️ Deploy on Render

https://img.shields.io/badge/Deploy%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white

▶️ Video Tutorial

For a complete walkthrough, watch our YouTube tutorial:

<div align="center">

https://img.shields.io/badge/Watch%20Tutorial-FF0000?style=for-the-badge&logo=youtube&logoColor=white

</div>

---

🌐 Community & Support

Join our community channels for updates, help, and discussions.

<div align="center">

https://img.shields.io/badge/Join-Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white
https://img.shields.io/badge/Join-WhatsApp%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white
https://img.shields.io/badge/Report%20Issues-GitHub-181717?style=for-the-badge&logo=github

</div>

---

📚 Commands Overview

As-zara-mini comes with a rich set of commands. Type .menu in WhatsApp to see the full list. Below are some highlights:

Category Commands Description
General .menu, .ping, .runtime Bot info and status
Sticker .sticker, .toimage, .emoji Create stickers from images/videos
Download .ytmp3, .ytmp4, .tiktok Download media from YouTube, TikTok
Group .antilink, .welcome, .tagall Group management tools
Owner .restart, .update, .setpp Bot control and customization

💡 All commands are configurable via config.js and the command files.

---

🤝 Contributing

We welcome contributions! If you'd like to improve As-zara-mini:

1. Fork the repository.
2. Create a new branch (git checkout -b feature/amazing-feature).
3. Commit your changes (git commit -m 'Add some amazing feature').
4. Push to the branch (git push origin feature/amazing-feature).
5. Open a Pull Request.

Please ensure your code follows the existing style and includes appropriate documentation.

---

📝 License & Legal

License

This project is licensed under the MIT License – see the LICENSE file for details.

Important Warning

· Educational Purpose Only – This bot is created for learning and experimentation.

Usage Guidelines

· ✅ Do use for personal automation and learning.
· ❌ Do not spam, harass, or engage in illegal activities.
· ❌ Do not use for bulk messaging or malicious purposes.

---

🙏 Credits

· Dex Shyam Chaudhari – Main developer & maintainer
· Baileys – The core WhatsApp Web API library
· All contributors and open‑source libraries listed in package.json

---
 Support the Developer

If you find this project helpful and would like to support its development, consider buying me a bots!

<div align="center">

https://dex-shyam-ha4kr.page.gd

<img src="utils/bmc_qr.png" alt="Buy Me a bot QR Code" width="200">

</div>

---

<div align="center">

Made with ❤️ by Dex Shyam Chaudhari
© 2026 DEX. All rights reserved.

</div>
```