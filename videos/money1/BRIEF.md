# EP 1/6: "This $20 bill cost 7 cents to print. So why is it worth $20?"

Series: **MONEY, EXPLAINED** (6 episodes). This file also holds the **series plan**: order, branding and shared set. Each episode's own BRIEF only covers that episode.

---

## SERIES PLAN (applies to money1–money6)

### Name and branding
- **Series tag (proposed):** `• HOOT EXPLAINS · MONEY, EXPLAINED · EP N/6`
  - It keeps our page template ("• HOOT EXPLAINS · TOPIC") and adds the series name.
  - "/6" shows a finite run, like "DAY 1/3" in the sleep series. A finite series gives people a reason to finish it, and series convert better (growth playbook §2; viral refs rule 21).
  - "Money, Explained" is plain and searchable. I looked at alternatives ("Jake's Money Files", "Follow the Money"). The first hides the topic. The second sounds like a conspiracy channel, which clashes with our trust-first tone.
- **Episode counter chip:** "EP N/6", top left. It stays on for the whole video, like the "DAY 1 OF 3" chip.
- **Money chip:** "NOT FINANCIAL ADVICE", small, bottom-left of the safe area. It shows from second 1 to the end in every episode (rule 28).
- **Source chip:** for each sourced number, at the moment it's spoken (rule 27).
- **Recurring cast:**
  - **Jake** (red hoodie) lives each money moment.
  - **Hoot** perches nearby, faces the camera and explains.
- **Recurring set:** Jake's room, reused from `src/scenes/awake` (desk, laptop, bed, fridge, window). On top of that, one new "Money Street" place: bank front, Fed front and coffee shop, side by side and reused across episodes (see SHOTS.md).

### Recommended order (post on 6 consecutive days)
| # | id | Title | Ends by teeing up |
|---|---|---|---|
| 1 | money1 | This $20 bill cost 7 cents to print. So why is it worth $20? | "…mostly created by banks" → EP2 |
| 2 | money2 | Banks create money out of thin air | "…prices tend to rise" → EP3 |
| 3 | money3 | Why is your money worth less every year? | "Is your savings beating 3.7%?" → EP4 |
| 4 | money4 | Why does your bank pay you so little? | "…banks charge about 22% on credit cards" → EP5 |
| 5 | money5 | The minimum payment trap | "Interest worked against Jake. Next, it works for him" → EP6 |
| 6 | money6 | $6 a day on coffee: what it really costs | Series finale: "Time was." |

**Why this order:**
1. **It is one argument from start to finish:**
   - what money is (EP1)
   - who makes it (EP2)
   - why it shrinks (EP3)
   - where you keep it (EP4)
   - how it's used against you (EP5)
   - how to make it work for you (EP6)

   Each episode's last line answers "why should I watch the next one?" ("but/therefore" at series scale).
2. **It opens with the strongest "no way" facts.** "7 cents to print" (EP1) and "out of thin air" (EP2) are surprise hooks with no jargon, which work best in the first seconds (rules 1 and 9). Starting with these grows the follower base before the practical episodes.
3. **It ends on the most hopeful, most shareable episode.** The coffee test is the format the game plan named as our first money test (game plan §3b). Ending there leaves people feeling they can act, and EP6's "send to" person is the broadest.
4. **Emotions rise through the run:**
   - surprise (EP1–2)
   - mild fear (EP3)
   - outrage (EP4)
   - fear plus relief (EP5)
   - hope (EP6)

   All are high-arousal, which is what spreads (Berger & Milkman, rule 3).

**Alternative to test:** if EP1 underperforms (stayed-to-watch below our median), post EP6 as a **trial reel** first. It's the most proven format: A-vs-B with money counters (viral refs rules 7 and 10). Use the winner's hook pattern for the rest.

### Pacing note (important for the builder)
- The task brief assumed ~2.3 words per second. **Our real Kokoro timings run at 3.6–3.9 words per second.** Measured from `public/videos/{awake1,airplanemode,sleep2}/timings.json`: 195 words in 54.0 s, 217 in 56.1 s, 118 in 32.2 s.
- So each script below (97–105 words) should come out at **~31–33 s including the 1.8 s tail and the "hold" pauses**. That's inside the 30–45 s target and at the short end that is easiest to keep above 80% watched (game plan §1).
- If the voice comes out faster than expected, raise the existing `hold` values (after big numbers) rather than adding words.

### Scene naming (deviation, on purpose)
- The original brief asked for one scene per id. For a **series**, I followed the sleep/awake precedent instead: one shared scene **`"scene": "money"`** plus an **`"ep": N`** field, like `"day"` in awake1.
- Reason: the room, street, cast, chips and counters are shared, so one scene module with per-episode beat events is far cheaper to build (game plan §4, "Reuse scenes").
- If the pipeline needs a scene per id, just set `scene` to the id. Nothing else changes.

---

## EP 1: the facts (all checked 3 Nov 2026)

| Claim in the script | Source | Notes |
|---|---|---|
| A $20 bill costs about 7 cents to print | Federal Reserve FAQ "How much does it cost to produce currency and coin?": 2025 currency budget, variable printing cost **$20 = 7.3 cents** ($1 = 4.1¢, $100 = 11.3¢). Page updated 13 Nov 2025. https://www.federalreserve.gov/faqs/currency_12771.htm | Spoken "about 7 cents". On screen: "7.3¢ · SOURCE: FEDERAL RESERVE". |
| Barter needs a "double coincidence of wants" | Federal Reserve Education, "Functions of money": barter needs "two people each have something that the other wants". https://www.federalreserveeducation.org/teaching-resources/economics/money/functions-of-money | Anthropologists (e.g. Caroline Humphrey, 1985) argue no economy ran *purely* on barter. The script says only "People used to swap", which is true; it doesn't claim a barter-only economy. |
| Shells, then coins, then paper | Britannica, "A brief and fascinating history of money": cowrie shells used as money from ~1200 BCE; earliest regulated coins in Lydia (King Alyattes, c. 610–560 BCE); paper money in China, reign of Zhenzong (997–1022 CE). https://www.britannica.com/story/a-brief-and-fascinating-history-of-money | On-screen year chips: "~1200 BC", "~600 BC", "~1000 AD". |
| "Backed by gold? Not since 1971." | Federal Reserve History, "Nixon Ends Convertibility of U.S. Dollars to Gold": the gold window closed **15 Aug 1971**; the system "turned into a fiat one". https://www.federalreservehistory.org/essays/gold-convertibility-ends | At home, the Treasury and banks stopped redeeming dollars for gold in 1933–34 (Gold Reserve Act, https://www.federalreservehistory.org/essays/gold-reserve-act). 1971 cut the **last** link (foreign governments). The script's wording ("backed by gold? not since 1971") is accurate. Reply text for comments is in the post kit. |
| "The law: it pays any debt or tax" | 31 U.S.C. §5103: US coins and currency "are legal tender for all debts, public charges, taxes, and dues". https://www.law.cornell.edu/uscode/text/31/5103 | Legal tender doesn't force a shop to accept cash for a sale. The script says "debt or tax", not "any shop must take it". |
| "…and trust that the next person will take it" | Federal Reserve Education: fiat money's value comes from being declared legal tender and from people having "faith in its use as money". (Same URL as above.) | |
| "Only about 1 in 10 dollars is even cash" | Federal Reserve H.6 release, 27 Oct 2026 (Sept 2026, seasonally adjusted): **currency $2,397.2B of M2 $23,413.9B = 10.2%**. Deposits (demand + other liquid + small time) = 81.9%. https://www.federalreserve.gov/releases/h6/current/default.htm | "Money" = M2, the Fed's broad measure. |
| "…mostly created by banks" | Bank of England, McLeay, Radia & Thomas, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1: "the majority of money in the modern economy is created by commercial banks making loans". https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy | Bank deposits are 82% of US M2 (above). The full mechanism is EP2. |
| (Context, not spoken) Cash is 14% of US payments | Fed Diary of Consumer Payment Choice (2026 report, 2025 data): cash = 14% of payments by number, down from about a third in 2016. https://www.frbservices.org/binaries/content/assets/crsocms/news/research/2026-diary-consumer-payments-choice.pdf | For the pinned comment or replies. |

## Angle
- **Hook:** a "no way" number about an object everyone holds: a $20 that cost 7 cents.
- **Myth, then truth:** "it's backed by gold" → not since 1971 → it's law plus trust.
- **Twist:** cash isn't even most of our money anymore. That opens the loop for EP2 ("…mostly created by banks").
- Jake lives it: holding the bill, swapping fish in a market flash-back, paying by phone.

## Who would someone send this to?
**The friend who says "cash is king"** or the gold-bug uncle ("the dollar is backed by nothing!"). They'll argue, and arguments mean comments. Second: the friend who always pays with their phone.

## Why it should perform
- A "no way" number hook that is specific and concrete (rules 1 and 17; game plan §1: outcome or payoff in the first frame, here the 7¢ price tag on the bill).
- Myth, then truth (rule 18; viral refs rule 14).
- A "you" connection: it's in your wallet (rule 2).
- Social currency: a fact you can repeat at dinner (STEPPS, rule 3).
- Series opener with "EP 1/6" (rule 5; viral refs rule 21: a continuing series turns viewers into followers).
- Competitor scan: "doesn't work how you think" titles (pattern 3) and twist-statement titles beat plain questions.

## Script (≈105 words, ~33 s)
1. This 20 dollar bill cost about 7 cents to print. So why is it worth 20?
2. Rewind. People used to swap. Jake's fish for your shoes. But what if you hate fish?
3. So they used things everyone accepted. Shells, then coins, then paper.
4. Backed by gold? Not since 1971. So what backs it now?
5. Episode 1 of 6. Follow along.
6. The law: it pays any debt or tax. And trust that the next person will take it.
7. But in America, only about 1 in 10 dollars is even cash.
8. The rest is just numbers on screens, mostly created by banks. Do you still carry cash?

## SCRIPT_RULES checklist (final, after revisions)
- [x] **Who it's sent to:** the "cash is king" friend or the gold-bug uncle.
- [x] **First frame:** Jake holds the $20 with a red "COST: 7¢" price tag on it. **Hook line:** "This 20 dollar bill cost about 7 cents to print." (10 words; title phrase "20 dollar bill… 7 cents to print"). On-screen hook "THIS $20 BILL COST / 7 CENTS TO PRINT" matches.
- [x] **Every beat linked by but/therefore, with a loop open at all times:**
  - why worth 20? → *Rewind* (therefore) → *But* you hate fish → *So* shells, coins, paper → gold? *Not since 1971* (but) → *So what backs it now?* (loop held through the CTA) → law plus trust (pays off the hook) → *But* only 1 in 10 is cash → the rest is created by banks (new loop into EP2).
- [x] **Re-hooks** at ~4 s ("so why…?"), ~8 s ("but what if you hate fish?"), ~12 s ("Backed by gold? Not since 1971"), ~23 s ("But… only 1 in 10"). That's at least one every 10–15 s. **Visual change every ~2 s:** written per beat in SHOTS.md.
- [x] **Every number made concrete:**
  - 7¢ = a price tag on the bill
  - years = a rolling year counter
  - 1971 = a vault door slamming
  - 1 in 10 = ten bill icons with nine turning into glowing digits
- [x] **CTA** mid-video at the 1971 reveal (~16 s of 33). **Ending:** the punchline "mostly created by banks", then one specific ask ("Do you still carry cash?"). **Loop:** the last shot is Jake holding the bill, the same framing as frame 1.
- [x] **Sources** for every fact (table above); source chips on screen; NOT FINANCIAL ADVICE chip on throughout.
- [x] **Read aloud:**
  - no dotted abbreviations; "US" changed to "America" (Kokoro may say "us")
  - no "$" or "%" symbols in the narration
  - 105 words ≈ 33 s at our real 3.6 w/s
- [x] **Cover:** template with a twist statement: "THIS $20 COST / **7¢** / TO PRINT".

## Revision log
- **Pass 1 (self-check):**
  - "cost 7 cents" → "about 7 cents" (the real figure is 7.3¢)
  - added `hold` 0.4 s after "1971" and after "even cash" so the vault slam and the counter land
- **Hook match:** the on-screen hook said "TO MAKE" but the voice said "to print". Both now say PRINT.
- **Skeptical-editor pass:**
  - "1 in 10 US dollars": Kokoro may read "US" as "us", so it became "in America, only about 1 in 10 dollars".
  - Editor flagged that the barter beat at 4–9 s is the classic textbook drop-off point. Kept it to 4 s, and SHOTS makes it fast and funny (fish slap, sepia "REWIND" whip, year counter spinning backwards).
  - Editor asked whether "Do you still carry cash?" is too soft after the cliffhanger. Kept it: it's a yes/no vote about the viewer's own life (rule 23; viral refs rule 22). The cliffhanger is repeated as text on the outro card ("EP 2: HOW BANKS MAKE MONEY").
  - Considered cutting "Episode 1 of 6. Follow along." for time. Kept it: the mid-video series CTA is mandatory (rule 21).
