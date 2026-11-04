# EP 1/6 shot list: "This $20 bill cost 7 cents to print"

Times are estimates at our measured 3.6 words per second; the real timings come from `timings.json`. Pin every label to the spoken word with `labelWord`/`wordTime`, not to beat starts.

## Shared series pieces (built once in `src/scenes/money`, reused by EP1–6)

**Reuse as is**
- **Jake's room:** `src/scenes/awake/Scene.tsx` `Room` (desk, laptop, lamp, bed, nightstand, mini fridge, window with sky, clock, ceiling). Fix the time of day per episode: daytime by default, so set `daylightAt` = 1 and lids open (Jake is fresh; tiredness was a sleep-series thing).
- **Characters:** `Jake` (pose sit/stand, arms, `holdR`, expressions) and `TalkingHoot` (faces the camera, beak on `timings.mouth`).
- **Overlays:**
  - `Pill` and `Headline` (`learjet/overlays`)
  - `CirclePill` (`sleep/overlays`)
  - `HootBadge`
  - rough-notation circles on key numbers
- **Phone:** `src/scenes/airplanemode` `Phone` with a CanvasTexture screen. Reuse it for the banking app and card app screens: redraw the canvas with the balance and text.
- **Car:** the `Car` from `sleep/Scene.tsx` (`RoadPlace`), for the EP2 car loan.
- **Mug:** `Mug` from `sleep/Scene.tsx`, for the EP6 coffee.

**Series overlays (new, small, 2D)**
- "EP N/6" chip: top left at 4% top, inside the 5–80% width band.
- "NOT FINANCIAL ADVICE" chip: tiny, bottom left, above the platform UI zone. Always on.
- `MoneyCounter`: a big rolling number with `$` and thousands separators. It never runs backwards unless it's meant to go down, and then it turns red with a ▼.
- `SourceChip`: "SOURCE: …", shown for at least 1.5 s.

**New 3D assets (flagged)**
1. **Banknote prop.** A stylised, cartoon "20" note: flat green CanvasTexture, a big "20", a generic oval with an owl silhouette in place of a portrait.
   - Don't reproduce the real $20 design (18 U.S.C. §504 limits realistic currency images). Cartoon is safer and on-brand.
   - Size ~0.156 × 0.066 m (real note size), held in Jake's `holdR`.
2. **"7¢" price tag:** a red tag on a string, hanging off the note.
3. **Money Street:** a new place, offset like `airplanemode` (x offset 600). Three façades side by side:
   - **BANK:** generic columns, the sign "BANK", no real bank brand
   - **THE FED:** a generic stone façade with the words "FEDERAL RESERVE" only, no seal
   - **COFFEE:** a coffee shop with an awning
   Used in EP2, 3, 4 and 6.
4. **Time-machine props (EP1 only):**
   - market stall
   - fish
   - pair of shoes
   - cowrie shells (small white ellipsoids with a slit)
   - coins (gold cylinders)
   - a paper note with "Chinese" red seal blocks (abstract, no real characters needed)
   - gold vault with a round door and gold bars
5. **Bank-screen "digits":** glowing green numbers floating up from a note. Particle text in a CanvasTexture sprite.

**Safety and layout rules**
- Labels stay within 5–80% width and off faces. The caption band (62–68% height) stays clear.
- Every label stays up at least 1.5 s.
- Show the source chip whenever a sourced number appears.

---

## Beat by beat

### B1 hook (0.0–4.5 s) · shot `billHook` (Jake's room, desk)
- **Frame 0 (the thumbnail):**
  - Medium close-up of Jake at the desk, holding the cartoon $20 up toward the camera at chest height, a slight smirk.
  - The red tag "COST: 7¢" swings from the note.
  - Hoot perches on the desk at the left, facing the camera, beak already moving.
  - Hook title on screen from frame 0, settled: "THIS $20 BILL COST / 7 CENTS TO PRINT" ("7 CENTS" in yellow accent).
  - Chips: "EP 1/6" and "NOT FINANCIAL ADVICE".
  - Camera: slow push-in (from 1.35 → 1.1 m).
  - No cut for 0–3 s (rule: first 3 s are one unbroken shot).
- **~1.0 s, "7 cents":** rough-notation circle around the tag; "7.3¢ · SOURCE: FEDERAL RESERVE" pill at 23% top. SFX: pen scribble.
- **~2.4 s, "why is it worth 20?":** a "?" pops over the note. Jake raises an eyebrow (brows +0.6) and flips the note over. SFX: paper flick.
- **~3.6 s:** hook title fades out. The counter chip "VALUE: $20 · COST: $0.07" sits under it for 1.5 s.

### B2 barter (4.5–9.0 s) · shot `barter` (new: time-machine market, warm sepia grade)
- **4.5 s, "Rewind":**
  - white flash, a VHS-style "◀◀ REWIND" pill and a whip pan
  - year counter at 23% top spins backwards: "2026 → 3000 BC"
  - SFX: tape rewind
- **5.4 s, "People used to swap":** wide shot of a market stall. Jake (same hoodie, plus a straw hat for fun) holds a big fish. A trader (a generic NPC: the existing passenger figures, recoloured) holds shoes.
- **6.5 s, "Jake's fish for your shoes":** two arrows swap fish ⇄ shoes, with an "SWAP" label.
- **7.6 s, "But what if you hate fish?":**
  - the trader pinches his nose and shakes his head
  - a red ✕ stamp over the arrows (draw the ✕ as two bars; no emoji glyphs)
  - Jake's face drops, and the fish flops
  - SFX: buzzer (low volume 0.2)
- **Hoot:** perched on the stall roof, facing the camera.

### B3 coins (9.0–12.2 s) · shot `timeline` (camera tracks sideways along a table of objects)
- **9.0 s, "So they used things everyone accepted":** the camera tracks right along a long wooden table. The year counter is now running forward.
- **9.8 s, "Shells":** cowrie shells pour onto the table; the chip "~1200 BC · SHELLS" appears. SFX: shell clatter.
- **10.6 s, "then coins":** gold coins drop and spin; "~600 BC · FIRST COINS (LYDIA)". SFX: coin ring.
- **11.4 s, "then paper":** a paper note flutters down; "~1000 AD · PAPER (CHINA)". SFX: paper whoosh.
- Source chip: "SOURCE: BRITANNICA".

### B4 gold (12.2–16.2 s + hold 0.4) · shot `vault` (new vault place)
- **12.2 s, "Backed by gold?":** inside a vault, gold bars stacked high and glowing. Jake looks up in awe (mouth open). The "BACKED BY GOLD?" pill shows for 1.5 s.
- **13.4 s, "Not since 1971":**
  - the round vault door SLAMS shut in the foreground, filling the frame
  - stamp label "1971 · GOLD LINK CUT"
  - small camera shake
  - SFX: heavy door slam (0.3) plus a low boom
  - source chip "SOURCE: FEDERAL RESERVE HISTORY"
- **15.0 s, "So what backs it now?":** cut to Jake outside the shut door, holding the note, puzzled. The "?" returns over the note.
- **Hold 0.4 s** on his puzzled face (the open loop).

### B5 mid CTA (16.2–18.0 s) · shot `vault` (continues; no cut)
- Hoot flies into frame centre-left (or is already perched on a gold bar outside the door), points the pencil at the camera and winks.
- Pill "EP 1 OF 6 · FOLLOW ALONG" with a small follow-button graphic, top 23%.
- SFX: soft pop.
- Jake keeps holding the note, so the loop stays visible.

### B6 law plus trust (18.0–22.7 s) · shot `billLaw` (Jake's room, desk, closer)
- **18.0 s, "The law":** the cut-out text "LEGAL TENDER · 31 U.S.C. §5103" stamps onto the note. SFX: rubber stamp. (The dotted abbreviation is fine on screen; it's never spoken.)
- **18.8 s, "pays any debt or tax":** two icons slide from the note: "DEBTS ✓" and "TAXES ✓". Draw ticks as shapes, not glyphs.
- **20.3 s, "And trust":** the note passes hand to hand: Jake → a cashier hand → a friend hand, three quick cuts, ~0.6 s each, with a "TRUST" counter ticking 1 → 2 → 3 people. SFX: three soft whooshes.
- **22.0 s:** back on Jake, who nods and is satisfied (smile +0.6).

### B7 twist (22.8–26.5 s, hold 0.4) · shot `phone` (Jake taps to pay; phone close-up)
- **22.8 s, "But in America":** Headline "BUT…" in yellow. Jake pulls his phone out instead of the note; the airplanemode `Phone` shows a pay screen.
- **23.6 s, "only about 1 in 10 dollars is even cash":**
  - a row of 10 cartoon bills appears across the frame (top 18%)
  - 9 of them dissolve into glowing green digits, leaving 1 paper bill
  - CirclePill "1 IN 10 = CASH" with "10%" circled
  - source chip "SOURCE: FEDERAL RESERVE (M2, SEPT 2026)"
  - SFX: 9 quick digital blips
- **Hold 0.4 s** on the 1 lonely bill.

### B8 final (26.5–31 s + tail 1.8) · shot `billHook` (same framing as frame 0, for the loop)
- **26.5 s, "The rest is just numbers on screens":** the 9 digit-bills fly into Jake's laptop screen and become a balance "$ 1,240.00" (any plausible number).
- **27.8 s, "mostly created by banks":**
  - a "BANK" building icon types onto the screen with a blinking cursor
  - pill "EP 2: HOW BANKS MAKE MONEY" (top 23%), held to the end
  - SFX: keyboard clacks
- **29.0 s, "Do you still carry cash?":**
  - outro title "DO YOU STILL / CARRY CASH?" (accent on CASH)
  - Jake holds the $20 up again, exactly the frame-0 pose, so the video loops
  - Hoot does a wing thumbs-up
- Cut at the end of the tail. No lingering.

## Visual change audit (one at least every ~2 s)
Changes happen at 1.0, 2.4, 3.6, 4.5, 5.4, 6.5, 7.6, 9.0, 9.8, 10.6, 11.4, 12.2, 13.4, 15.0, 16.2, 18.0, 18.8, 20.3, 21.0, 21.6, 22.0, 22.8, 23.6, 26.5, 27.8 and 29.0 s. The longest gap is 2.2 s. ✓
