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

## v1.3.2 (2026-11-06)
- Replaced WebAudio synth BGM with Kevin MacLeod tracks (CC BY 4.0): title=Heroic Age, battle=Clash Defiant, boss=Five Armies, phase2=All This. Dual-element crossfade at track changes and loop wraps.
- Re-muxed opening + cs1–4 videos (Heroic Age only; old synth soundtrack removed).
- APK: BGM autoplays on launch (`setMediaPlaybackRequiresUserGesture(false)` + CrimsonNative/file detection). Web: first-touch unlock + 「點一下開啟音樂」prompt.
- Settings: music/SFX volume sliders (bgmVol/sfxVol, old-save-safe defaults); 版權／致謝 screen; same credits in README.
- SFX remain WebAudio (levels clamped). Save key `crimson_save_v1` preserved.
- Verified BGM currentTime advances on SE 375×667, iPhone14, Fold ~439×1024, desktop; no console errors; volume/mute/credits/video skip OK.
- APK VC6 / VN 1.3.2.

## v2.0.0 (2026-11-06)
- Gacha/summon: 💎 gems (first clear + stars) + 💰 coin pulls; ★3–★5 (8 new heroes); dupes → 🧩 mats; egg/portal + rarity flash; Android vibration.
- Owned roster + team editor; old saves migrate original 10 owned; `crimson_save_v1` coins/progress kept.
- Level-up: coins + mats; before/after stats (↑ red / ↓ green). Faster lvMul (0.11/lv), cheaper upCost, higher stage gold/exp.
- **All normal + boss HP ×2** (`HP_SCALE=2`); per-turn caps/phases scale with HP. Enemy ATK slightly lowered so long fights are not walls.
- Avg-player sim (STEPS=5): ch1–5 win 100/100/100/99/98% (min 92%); typical boss turns ~4–9 (ch1) → ~17–20 (ch5 chapter). Skilled ALL PASS; boss turns ~3–9.
- Art: c_fire3/4, c_water3/4, c_wood3/4, c_light3, c_dark3, summon_egg/flash.
- APK VC7 / VN 2.0.0.

## v2.0.1 (2026-11-06)
- Story-gated recruitment: new players start with CORE 諾菈/莉瑟拉/瑪琳 (3). Others join via story (章節頭目後) or battle-then-dialogue (勁敵關).
- Join schedule: garen battle@4, fiel story@8, sein battle@12, kain story@16, ed battle@20, bark story@24, vela battle@29 (1-based stages).
- Friend leaders = owned only. Existing saves keep all owned characters.
- Gem economy: daily login calendar (20–80 + streak), 3 daily missions, chapter-boss first-clear bonus, join gems, coin→gem shop (60/8000, 160/20000, 450/52000; 2/day, 2nd ×1.25).
- Early enemy ATK −22% in ch1 for 3-hero start. Sim ALL PASS.
- APK VC8 / VN 2.0.1.

## v2.1.0 (2026-11-06)
- Main story 40→50 (ch6 緋月裂縫 stages 41–50); CH_BOUNDS non-uniform chapter lengths.
- New hero 琳 (rin) battle-join ~stage 44; bosses/bg: crimson_moon, void_knight, eclipse, moon_priest, n_void1/2, bg_rift.
- Cutscenes cs5 + ending (Heroic Age); clear 39→cs5+ch6 story; clear 49→ending+hiddenUnlock.
- Hidden unlock all50 with grandfather (cleared 0–39 keep access).
- 必殺技 cut-in: 「必殺技！」+ Japanese skill name/reading; Grok Imagine video cut-ins (lysera/zer/rin + gender fallbacks); voice pre-rendered gTTS JA (male pitch-shifted), speechSynthesis ja-JP fallback; settings 絕招語音 + 語音音量.
- Sim skilled (STEPS=7,LV=28): ch1–6 means 100/100/100/100/98/100% (ch5 min 88%).
- APK VC13 / VN 2.1.0.
