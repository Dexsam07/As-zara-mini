![WELLCOME](utils/wellcome.svg)
  
______

[![AS-ZARA-MINI](https://raw.githubusercontent.com/Dexsam07/As-zara-mini/main/utils/mr.svg)](https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o)
___ 

<p align="center">
  <a href="https://github.com/Dexsam07" target="_blank">
    <img src="./utils/dev-gold-mini.svg" width="300" alt="Developer — Dex Shyam Chaudhari (Gold 3D)">
  </a>
</p>

  
<p align="center">
  <a href="https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o" target="_blank">
    <img src="./utils/channel-update.svg" width="350" alt="Bot Updating — WhatsApp Channel | Join Fast">
  </a>
</p>

---------

<p align="center">
<a href="https://github.com/Dexsam07/As-zara-mini"><img title="PUBLIC-BOT" src="https://img.shields.io/static/v1?label=Language&message=JavaScript&style=square&color=darkpink"></a> &nbsp;
  <img src="https://komarev.com/ghpvc/?username=Dexsam07&label=VIEWS&style=square&color=blue" />
</p>


-------------

<p align="center">
<img src="utils/feature-bot.svg" alt="Feature Bot" width="900"/>
  
<p align="center">
<img src="utils/license.svg" alt="License" width="200"/>

--------------

<p align="center">
<img src="utils/maintenance.svg" alt="Maintenance" width="120"/>


 <p align="center">
  <a href="https://github.com/Dexsam07/As-zara-mini/fork" target="_blank">
    <img src="utils/forkstar-holo.svg" width="180" alt="Fork Star Bot Repo"/>
  </a>
</p>


<p align="center">
  <a href="https://as-zara.zone.id/" target="_blank">
    <img src="./utils/paircode-link.svg" width="195" alt="PAIR_CODE – Device Session ID">
  </a>
</p>

-------------

<p align="center">
  <img src="./utils/deployment.svg" width="600" alt="AS-ZARA-MINI — News Ticker Typing">
</p>

<div align="center">
  <table>
    <tr>
      <td><a href="https://dashboard.heroku.com/new-app?template=https://github.com/Dexsam07/As-zara-mini" target="_blank"><img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white&labelColor=000000&color=0000FF"/></a></td>
      <td><a href="https://bot-hosting.net/?aff=1335487206948864030" target="_blank"><img src="https://img.shields.io/badge/Bot-Hosting-A52A2A?style=for-the-badge&logo=firefoxbrowser&logoColor=white&labelColor=000000"/></a></td>
    </tr>
    <tr>
      <td><a href="https://app.koyeb.com/deploy?name=as-zara-mini-v6-koyeb&type=git&repository=Dexsam07%2FAs-zara-mini&branch=main&builder=dockerfile&instance_type=free&regions&=was&env%5BSESSION_ID%5D=" target="_blank"><img src="https://img.shields.io/badge/KOYEB-APP-FF009D?style=for-the-badge&logo=koyeb&logoColor=white&labelColor=000000"/></a></td>
      <td><a href="https://railway.app/new" target="_blank"><img src="https://img.shields.io/badge/Railway-000080?style=for-the-badge&logo=railway&logoColor=white&labelColor=000000"/></a></td>
    </tr>
    <tr>
      <td><a href="https://dashboard.katabump.com/auth/login#3c8183" target="_blank"><img src="https://img.shields.io/badge/KataBump-000000?style=for-the-badge&logo=render&logoColor=white&labelColor=000000&color=FFFF00"/></a></td>
      <td><a href="https://www.smd-host.site/" target="_blank"><img src="https://img.shields.io/badge/Free-host-CC00FF?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=000000"/></a></td>
    </tr>
  </table>
</div>

<table align="center">
  <tr>
    <td>
      <a href="https://dashboard.render.com/" target="_blank">
        <img alt="Deploy on Render" src="https://img.shields.io/badge/Deploy%20on%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=white"/>
      </a>
    </td>
  </tr>
</table>  

-------------

**_✠ FREE DEPLOYMENT OF AS-ZARA-MINI GITHUB WORKFLOW CODE NEW ADD ERROR FIXED ✠_**

```yaml
name: Node.js CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [24.x]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        check-latest: true

    - name: Install dependencies
      run: npm install

    - name: Build project (optional)
      run: npm run build || echo "No build script found, skipping..."

    - name: Start application
      run: npm start
