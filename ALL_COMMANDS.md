# AS-ZARA-Mini Bot — Complete Command List

Generated from the current project. **119 command modules** are listed. Files under `commands/lib/` are internal helpers, not user commands.

| Category | Command | Aliases | Usage | Source file |
|---|---|---|---|---|
| admin | `.antigroupmention` | agm | `.antigroupmention <on/off/set/get>` | `commands/admin/antigroupmention.js` |
| admin | `.antilink` | — | `.antilink <on/off/set/get>` | `commands/admin/antilink.js` |
| admin | `.antitag` | antimention, 'at | `.antitag <on/off/set/get>` | `commands/admin/antitag.js` |
| admin | `.autosticker` | autos, 'asticker | `.autosticker <on/off>` | `commands/admin/autosticker.js` |
| admin | `.clean` | purge, 'clear | `.clean <number>` | `commands/admin/clean.js` |
| admin | `.delete` | del | `.delete (reply to a message)` | `commands/admin/delete.js` |
| admin | `.demote` | removeadmin | `.demote @user` | `commands/admin/demote.js` |
| admin | `.goodbye` | goodbyeon, 'goodbyeoff | `goodbye on/off` | `commands/admin/goodbye.js` |
| admin | `.grouplink` | link, 'invite | `.grouplink` | `commands/admin/grouplink.js` |
| admin | `.hidetag` | tag | `.tag <message> (or reply to media)` | `commands/admin/hidetag.js` |
| admin | `.kick` | remove | `.kick @user` | `commands/admin/kick.js` |
| admin | `.mute` | close, 'closegroup | `.mute` | `commands/admin/mute.js` |
| admin | `.promote` | makeadmin | `.promote @user` | `commands/admin/promote.js` |
| admin | `.resetwarn` | resetwarning, 'clearwarn, 'unwarn, 'delwarn | `.resetwarn @user` | `commands/admin/resetwarn.js` |
| admin | `.setgoodbye` | goodbyetext | `setgoodbye <message> (use @user for member mention)` | `commands/admin/setgoodbye.js` |
| admin | `.setwelcome` | welcometext | `setwelcome <message> (use @user for member mention)` | `commands/admin/setwelcome.js` |
| admin | `.tagall` | mentionall, 'everyone | `.tagall <message>` | `commands/admin/tagall.js` |
| admin | `.unmute` | open, 'opengroup | `.unmute` | `commands/admin/unmute.js` |
| admin | `.warn` | warning | `.warn @user <reason>` | `commands/admin/warn.js` |
| admin | `.welcome` | welcomeon, 'welcomeoff | `welcome on/off` | `commands/admin/welcome.js` |
| ai | `.ai` | gpt, 'chatgpt, 'ask | `.ai <question>` | `commands/ai/ai.js` |
| ai | `.imagine` | magic, 'magicai, 'aiimage, 'generate | `magicstudio <prompt>` | `commands/ai/magicstudio.js` |
| anime | `.hneko` | hnekonsfw | `hneko` | `commands/anime/hneko.js` |
| anime | `.hwaifu` | hwaifunsfw | `hwaifu` | `commands/anime/hwaifu.js` |
| anime | `.konachan` | konachansfw | `konachan` | `commands/anime/konachan.js` |
| anime | `.loli` | lolinsfw | `loli` | `commands/anime/loli.js` |
| anime | `.megumin` | meguminnsfw | `megumin` | `commands/anime/megumin.js` |
| anime | `.milf` | milfnsfw | `milf` | `commands/anime/milf.js` |
| anime | `.neko` | nekosfw | `neko` | `commands/anime/neko.js` |
| anime | `.random` | animerandom, 'randomanime | `random` | `commands/anime/random.js` |
| anime | `.waifu` | waifusfw | `waifu` | `commands/anime/waifu.js` |
| fun | `.compliment` | praise, 'compliment | `compliment [@user]` | `commands/fun/complimentry.js` |
| fun | `.dare` | — | `dare` | `commands/fun/dare.js` |
| fun | `.flirt` | pickup, 'pickupline | `flirt [@user]` | `commands/fun/flirt.js` |
| fun | `.gayrate` | gay | `.gayrate (reply or @user)` | `commands/fun/gayrate.js` |
| fun | `.insult` | insultme, burn | `.insult (reply or @user)` | `commands/fun/insult.js` |
| fun | `.joke` | jokes | `.joke` | `commands/fun/joke.js` |
| fun | `.meme` | memes | `.meme` | `commands/fun/meme.js` |
| fun | `.memesearch` | memes, 'sm, 'smeme, 'gifsearch, 'gif | `memesearch <query>` | `commands/fun/memesearch.js` |
| fun | `.pies` | pie, 'india, 'malaysia, 'thailand, 'china, 'indonesia, 'japan, 'korea, 'vietnam | `pies <country>` | `commands/fun/pies.js` |
| fun | `.ship` | shipit, match | `.ship (random) OR .ship @user1 @user2 OR reply with .ship` | `commands/fun/ship.js` |
| fun | `.truth` | — | `truth` | `commands/fun/truth.js` |
| general | `.attp` | ttp | `<text>` | `commands/general/attp.js` |
| general | `.ZellAPI` | bot, 'ai, 'achat | `.chatbot <on|off>` | `commands/general/chatbot.js` |
| general | `.creact` | cmdreact | `.creact on/off` | `commands/general/cmdreact.js` |
| general | `.crop` | square, 'cropper | `.crop (reply to sticker/image/video)` | `commands/general/crop.js` |
| general | `.getpp` | gp, 'getpic | `.getpp (reply to message or tag user)` | `commands/general/getpp.js` |
| general | `.github` | repo, 'git, 'source, 'sc, 'script | `.github` | `commands/general/github.js` |
| general | `.groupinfo` | info, 'ginfo | `.groupinfo` | `commands/general/groupinfo.js` |
| general | `.groupstats` | stats, 'leaderboard, 'gstats, 'topmembers, 'msgs, 'messagestats | `.groupstats` | `commands/general/groupstats.js` |
| general | `.kick` | remove, 'fire | `.kick @user or reply to message` | `commands/general/kick.js` |
| general | `.list` | — | `.list` | `commands/general/list.js` |
| general | `.mention` | setmention, 'mentionreply | `.mention <on|off> or .setmention (reply to media)` | `commands/general/mention.js` |
| general | `.menu` | help, 'commands | `.menu` | `commands/general/menu.js` |
| general | `.myactivity` | mystats, 'mymsgs, 'rank | `.myactivity` | `commands/general/myactivity.js` |
| general | `.owner` | creator, 'dev, 'botowner | `.owner` | `commands/general/owner.js` |
| general | `.pair` | paircode, 'session, 'getsession, 'sessionid | `.pair 91305395XXXX` | `commands/general/pair.js` |
| general | `.ping` | p | `.ping` | `commands/general/ping.js` |
| general | `.qr` | qrcode | `.qr <text>` | `commands/general/qr.js` |
| general | `.simage` | toimg, 'stickertoimg, 'sticker2img, 'svideo | `.simage (reply to sticker)` | `commands/general/simage.js` |
| general | `.ssweb` | screenshot, 'ss, 'webss | `.ssweb <url>` | `commands/general/ssweb.js` |
| general | `.sticker` | s, 'stiker, 'stc | `.sticker (reply to media)` | `commands/general/sticker.js` |
| general | `.tagnotadmin` | tagmembers, 'tagnon | `.tagnotadmin` | `commands/general/tagnotadmin.js` |
| general | `.take` | steal | `.take [packname] (reply to sticker)` | `commands/general/take.js` |
| general | `.translate` | tr, 'trans | `.translate <lang code> <text>` | `commands/general/translate.js` |
| general | `.tts` | speak, 'say | `.tts <text>` | `commands/general/tts.js` |
| general | `.unban` | pardon | `.unban [@user] or reply to message` | `commands/general/unban.js` |
| general | `.uptime` | runtime, 'botuptime, 'alive | `.uptime` | `commands/general/uptime.js` |
| general | `.viewonce` | readvo, 'read, 'vv, 'readviewonce | `.viewonce (reply to view-once message)` | `commands/general/viewonce.js` |
| general | `.welcome` | setwelcome | `.welcome [on/off/message]` | `commands/general/welcome.js` |
| media | `.facebook` | fb, 'fbdl, 'facebookdl | `.facebook <Facebook URL>` | `commands/media/facebook.js` |
| media | `.igs` | igsticker | `.igs <Instagram URL>` | `commands/media/igs.js` |
| media | `.igsc` | igstickercrop | `.igsc <Instagram URL>` | `commands/media/igsc.js` |
| media | `.instagram` | ig, 'insta, 'igdl, 'reels | `<Instagram URL>` | `commands/media/instagram.js` |
| media | `.lyrics` | lyric, 'lirik | `<song name>` | `commands/media/lyrics.js` |
| media | `.song` | play, 'music, 'yta | `.song <song name or YouTube link>` | `commands/media/song.js` |
| media | `.tiktok` | tt, 'ttdl, 'tiktokdl | `.tiktok <TikTok URL>` | `commands/media/tiktok.js` |
| media | `.ytvideo` | ytv, 'ytmp4, 'ytvid, 'video | `.video <video name or URL>` | `commands/media/video.js` |
| owner | `.anticall` | — | `.anticall on/off` | `commands/owner/anticall.js` |
| owner | `.autoreact` | ar | `.autoreact on <country-code-number> | off | status | emoji | set bot|all` | `commands/owner/autoreact.js` |
| owner | `.ban` | blockuser | `.ban @user or reply to a message` | `commands/owner/ban.js` |
| owner | `.block` | — | `.block @user or reply` | `commands/owner/block.js` |
| owner | `.broadcast` | bc | `.broadcast <message>` | `commands/owner/broadcast.js` |
| owner | `.github` | repo, 'git, 'source, 'sc, 'script | `.github` | `commands/owner/github.js` |
| owner | `.gitinfo` | infogit | `.gitinfo` | `commands/owner/gitinfo.js` |
| owner | `.groupinfo` | ginfo, 'gcinfo, 'infogroup | `.groupinfo` | `commands/owner/groupinfo.js` |
| owner | `.addplugin` | installplugin, 'install | `.addplugin <Gist URL>` | `commands/owner/installplugin.js` |
| owner | `.mode` | botmode, 'privatemode, 'publicmode | `.mode <private/public>` | `commands/owner/mode.js` |
| owner | `.newsletter` | channel, 'channelinfo, 'nl | `.newsletter <channel link>` | `commands/owner/newsletter.js` |
| owner | `.rentbot` | botclone, 'clonebot | `.rentbot 91305xxxxxxx` | `commands/owner/rentbot.js` |
| owner | `.restart` | reboot, 'reload | `.restart` | `commands/owner/restart.js` |
| owner | `.setbotname` | setname, 'botname | `.setbotname <new name> or reply to a message with .setbotname` | `commands/owner/setbotname.js` |
| owner | `.setbotpp` | setppbot, 'setpp | `.setbotpp (reply to image or sticker)` | `commands/owner/setbotpp.js` |
| owner | `.setmenuimage` | setmenuimg, 'changemenuimage | `.setmenuimage (reply to image/sticker)` | `commands/owner/setmenuimage.js` |
| owner | `.setnewsletter` | setnl, 'setchannel | `.setnewsletter <newsletter JID>` | `commands/owner/setnewsletter.js` |
| owner | `.setprefix` | prefix | `.setprefix <new prefix>` | `commands/owner/setprefix.js` |
| owner | `.unblock` | — | `.unblock @user or reply` | `commands/owner/unblock.js` |
| owner | `.update` | upgrade | `.update [optional_zip_url]` | `commands/owner/update.js` |
| textmaker | `.1917` | — | `.1917 <text>` | `commands/textmaker/1917.js` |
| textmaker | `.arena` | — | `.arena <text>` | `commands/textmaker/arena.js` |
| textmaker | `.blackpink` | — | `.blackpink <text>` | `commands/textmaker/blackpink.js` |
| textmaker | `.devil` | — | `.devil <text>` | `commands/textmaker/devil.js` |
| textmaker | `.fire` | — | `.fire <text>` | `commands/textmaker/fire.js` |
| textmaker | `.glitch` | — | `.glitch <text>` | `commands/textmaker/glitch.js` |
| textmaker | `.hacker` | — | `.hacker <text>` | `commands/textmaker/hacker.js` |
| textmaker | `.ice` | — | `.ice <text>` | `commands/textmaker/ice.js` |
| textmaker | `.impressive` | — | `.impressive <text>` | `commands/textmaker/impressive.js` |
| textmaker | `.leaves` | — | `.leaves <text>` | `commands/textmaker/leaves.js` |
| textmaker | `.light` | — | `.light <text>` | `commands/textmaker/light.js` |
| textmaker | `.matrix` | — | `.matrix <text>` | `commands/textmaker/matrix.js` |
| textmaker | `.metallic` | — | `.metallic <text>` | `commands/textmaker/metallic.js` |
| textmaker | `.neon` | — | `.neon <text>` | `commands/textmaker/neon.js` |
| textmaker | `.purple` | — | `.purple <text>` | `commands/textmaker/purple.js` |
| textmaker | `.sand` | — | `.sand <text>` | `commands/textmaker/sand.js` |
| textmaker | `.snow` | — | `.snow <text>` | `commands/textmaker/snow.js` |
| textmaker | `.thunder` | — | `.thunder <text>` | `commands/textmaker/thunder.js` |
| utility | `.calc` | calculate, 'math | `.calc <expression>` | `commands/utility/calc.js` |
| utility | `.translate` | trt, 'tr | `.translate <text> <lang> or .translate <lang> (reply to message)` | `commands/utility/translate.js` |
| utility | `.weather` | w, 'clima | `.weather <city>` | `commands/utility/weather.js` |

## Important Notes

- Commands marked as owner-only or admin-only still require the appropriate permissions.
- The exact prefix is controlled by `config.js`; the examples use the default dot prefix.
- Some legacy modules use `command` metadata while newer modules use `name`; both are included by the loader.
- The existing `.autoreact` command is listed once and includes target, random, fixed/custom emoji, and legacy modes.
