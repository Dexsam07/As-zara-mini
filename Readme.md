<div align="center">
  
# 🤖 AS-ZARA-MINI – WhatsApp Multi-Device Bot

[![Made with Baileys](https://img.shields.io/badge/Made%20with-Baileys-00bcd4?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Dexsam07/As-zara-mini?style=for-the-badge&logo=github)](https://github.com/Dexsam07/As-zara-mini/network/members)

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

Create your own copy of **AS-ZARA-MINI** by forking on GitHub.

<div align="center">
  
[![Fork on GitHub](https://img.shields.io/badge/Fork%20Repository-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Dexsam07/As-zara-mini/fork)

</div>

### 2. Obtain Your Session String

Use the official pair code generator to get a session string. **Never share your session string publicly** – it gives full access to your WhatsApp account.

<div align="center">
  
[![Generate Pair Code](https://img.shields.io/badge/Generate-Pair%20Code-blueviolet?style=for-the-badge)](https://as-zara.zone.id/)

</div>

After scanning, you will receive a session string starting with `AS~...`.  
Store it **securely** and **never commit it** to any public repository.

#### How to Use Your Session

- **Option 1:** Set it as the environment variable `SESSION_ID` on your hosting platform.  
- **Option 2:** Paste it directly into `config.js` (only if you are running locally and **never** push this file to GitHub).

Example `config.js` snippet (never commit this file if it contains your session):

```js
sessionID: process.env.SESSION_ID || '', // Use environment variable for security
```

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
git clone https://github.com/your-username/As-zara-mini.git
cd As-zara-mini

# Install dependencies
npm install

# Create a .env file (optional but recommended) to store your session
echo "SESSION_ID=your_session_here" > .env

# Edit config.js if you haven't used the .env approach
# (or leave sessionID empty to scan QR on first run)

# Start the bot
node index.js
```

If you left sessionID empty, a QR code will appear in the terminal – scan it with your WhatsApp to authenticate.

---

☁️ Deployment Guides

Choose your favourite platform:

<div align="center">

https://img.shields.io/badge/Deploy%20on-Katabump-orange?style=for-the-badge
https://img.shields.io/badge/Deploy%20on-Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white
https://img.shields.io/badge/Deploy%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white

</div>

▶️ Video Tutorial

For a complete walkthrough, watch our official YouTube tutorial:

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

AS-ZARA-MINI comes with a rich set of commands. Type .menu in WhatsApp to see the full list. Below are some highlights:

Category Commands Description
General .menu, .ping, .runtime Bot info and status
Sticker .sticker, .toimage, .emoji Create stickers from images/videos
Download .ytmp3, .ytmp4, .tiktok Download media from YouTube, TikTok
Group .antilink, .welcome, .tagall Group management tools
Owner .restart, .update, .setpp Bot control and customization

💡 All commands are configurable via config.js and the command files in the commands/ folder.

---

🤝 Contributing

We welcome contributions! If you'd like to improve AS-ZARA-MINI:

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

Important Warning & Disclaimer

· Educational Purpose Only – This bot is created for learning and experimentation. It is not an official WhatsApp product.
· Account Safety – Using third‑party bots may violate WhatsApp's Terms of Service and can lead to a permanent ban. Use at your own risk.
· No Affiliation – This project is not affiliated, authorized, maintained, sponsored, or endorsed by WhatsApp Inc. or any of its affiliates.
· No Liability – The developers assume no responsibility for any bans, data loss, or damages caused by using this software.

Usage Guidelines

· ✅ Do use for personal automation, learning, and fun.
· ❌ Do not spam, harass, or engage in illegal activities.
· ❌ Do not use for bulk messaging or malicious purposes.

---

🙏 Credits

· Dex Shyam Chaudhari – Main developer & maintainer of the official AS-ZARA-MINI bot.
· Baileys – The core WhatsApp Web API library.
· All contributors and open‑source libraries listed in package.json.

---

☕ Support the Developer

If you find this project helpful and would like to support its development, consider buying me a bot (or a coffee)!

<div align="center">

https://img.shields.io/badge/Support-Developer-FF813F?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white

<img src="utils/bmc_qr.png" alt="Support QR Code" width="200">

</div>

---

<div align="center">

Made with ❤️ by Dex Shyam Chaudhari
© 2026 DEX. All rights reserved.

</div>
```

🔒 Privacy & Security Enhancements

· Session Handling: Emphasised never committing session strings, using environment variables, and never sharing them.
· Clear Disclaimers: Expanded legal warnings, including WhatsApp ToS violations and account bans.
· Professional Structure: Added badges, a table of contents, and clearly separated sections.
· Community Links: All badges now have proper Markdown links (fixed from the draft).
· Official Bot Reference: Credited Dex Shyam Chaudhari as the official maintainer.
