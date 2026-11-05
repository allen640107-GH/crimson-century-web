# 緋紅世紀 PROGRESS
- [x] 珠子圖 (map.txt: 名稱→assets hash 前綴, assets 在 /cursor/stores/store-5eb3fa92-aa4c-4986-92bc-aca84c439214/grok-bot/agents/6e0ac780-6390-4c4b-8d2e-4c91e789d0b6/assets)
- [ ] 角色/怪物/頭目/背景圖
- [ ] 程式 web/
- [ ] 模擬 sim
- [ ] 截圖
- [ ] repo/pages
- [ ] apk/release

## v1.1.0 (2026-11-05)
- PAD mechanics: 4s timer, diagonal moves, staged cascades, combo/4-orb all-attack, sub attributes, friend leader, def, boss preempt/skills, stamina, special stages, EXP/levels, egg/chest.
- VFX: projectiles, hit numbers, cut-in, WARNING, shatter, ambient, reduced-effects toggle.
- Sim ALL PASS (STEPS=7/8). Screens reviewed on 4 sizes. Pushed; release v1.1.0 with APK (VC 2).

## v1.2.0 (2026-11-05)
- Vibration (navigator.vibrate / APK CrimsonNative bridge + VIBRATE permission), settings toggle 震動回饋. iOS Safari unsupported.
- Orchestral WebAudio BGM: strings ostinato, brass stabs, timpani, choir pads, reverb, compressor; separate boss theme.
- FX: hit-stop, graded/rotational big shake, elemental trails, combo counter scaling + blaze, FINISH/OVERDRIVE finisher; cut-in verified (shots/v12_*_4cutin.png).
- COMPARE_PAD.md. APK VC3. Old local APKs/backup removed; saves untouched.

## v1.3.0 (2026-11-05)
- 40 stages in 5 chapters (緋霧森林/沉沒神殿/冰封之海/天空神殿/緋紅王城), 3–5 waves, 2–5 enemies per wave (front row 3 + back row 2), boss + 0–2 escorts.
- 20 new normal species + 20 bosses; tiers 一般/精英/霸主 (normals) and 一般/覺醒/霸主 (bosses), each with its own color, glow, and size.
- Boss skills: conv, big, shield, poison, multi, absorb, jam, bind, time; enrage (<30%), resolve, part break. Normal enemies from stage 11 have special skills.
- Board: enhanced orbs (+), poison and jam orbs; cross/L/line5 shapes, row bonus, 3/4/5-attr resonance, weather per stage, 緋紅之刻 gauge (×2 all-hit).
- Conditional leader skills. Team presets (3), battle fast toggle.
- Videos: opening (once per session, tap = unmute then skip, replay in settings), looping animated title, cutscenes after first clear of stages 8/16/24/32, chapter story scenes and ending text.
- Retuned 1–40 (enemy ATK tied to expected team HP); sim ALL PASS (TRIALS=16, min win rate 94%).

## v1.3.1 (2026-11-06)
### Audio root cause
- opening.mp4 had AAC but was quiet (−23.9 LUFS) and always started muted; unmute only on opening tap, cutscenes stayed muted.
- menu.mp4 has **no audio track**; title BGM was WebAudio-only and often never left `suspended` (iOS/Android autoplay + APK WebView need a user gesture).
### Audio fix
- Original orchestral theme (strings/brass/choir/timpani) mixed loud into opening + cs1–4 (SFX quieter).
- Title BGM uses same motif as `snd/title.m4a` (HTMLAudioElement, loops).
- First tap anywhere: unlock AudioContext, unmute video, start title BGM after opening ends/skips. Visible `🔊 點一下開啟聲音`.
### Boss / balance
- Boss: higher HP, per-turn damage cap, 50% phase (shield+transform), resolve, damage-absorb skill on late chapter bosses; active skills go through `capHit`.
- Leader/active multipliers softened; late-stage ATK/HP curve smoothed.
- Sim: skilled (beam) + average (STEPS=5,BEAM=3).
### Freeze
- Root: CanvasGradient `addColorStop(undefined)` crashed the FX loop; also missing enemy DOM on mid-attack deaths left promises/busy stuck; win/lose could re-enter.
- Fix: null-safe FX/DOM, projectile timeout, win/lose `ending` guard, 9s battle watchdog + ERRLOG.
### Orb drag
- Held orb clamped inside board; path interpolated cell-by-cell including diagonals (no skipping).
### Back-row
- Larger back-row slot width/height + CSS scale for SE.

### Verification
- Audio loudness: opening −12.4 LUFS (max −0.7 dB); cs −14.9 LUFS; title.m4a −13.7 LUFS.
- 4 viewports: after first tap AudioContext=running, video unmuted; after skip title BGM playing.
- Orb: heldInside always true outside board; swaps all adjacent + chained (14 swaps on fast drag).
- Stress (SE): 59 turns / 5 stages, stuck=0, recov=0, no ERRLOG.
- Back-row SE sprite height 131px vs front 104px (was much smaller in v1.3.0).
- Sim skilled ALL PASS; avg late stages 83–100% (ch5 min 83%).
- Boss TTK skilled: normal ~3.1–5.5 turns, chapter ~4.4–7.1 turns.
- APK VC5 / VN 1.3.1. Upgrade list: UPGRADE_ZH.md.
