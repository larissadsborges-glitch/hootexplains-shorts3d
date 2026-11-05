# money5 (standalone, 2D): "Paying the minimum on a $3,000 credit card takes over 12 years"

Rewritten 5 Nov 2026 as a **standalone** video (owner rule: no "EP n/6", no series lines, no "not financial advice" tag). The old series script is `script_series_v1.json`; the series brief is kept below for its sources.

## Titles (A chosen on 5 Nov after the owner said "just go on")
- **A (built):** Paying the minimum on a $3,000 credit card takes over 12 years
- B: "I always pay the minimum. I'm fine."
- C: He paid $85. His debt only dropped $30.
- **Cover text:** MINIMUM PAYMENT / = 12+ YEARS

## Script (125 words, 38.8 s with the 1.8 s tail)
1. Jake owes 3,000 dollars on his credit card. Paying just the minimum? It takes over 12 years. *(hook: who + what in 3 words)*
2. Here's where his money really goes, and the number on his bill that gets him out. *(bridge at 5.4 s, opens the loop)*
3. His first minimum payment is 85 dollars. But 55 of that is interest. *(first payoff ~12 s)*
4. His card charges 22 percent a year, so only 30 dollars touches the debt.
5. Worse, as the debt shrinks, the minimum shrinks too. So it drags on, and on.
6. In the end, he pays over 7,000 dollars. For a 3,000 dollar debt. *(sendable line, ~24 s)*
7. But the way out is printed right on his bill. About 115 dollars a month clears it in 3 years. *(answer to the hook)*
8. Same debt, 9 years sooner, and he keeps about 2,900 dollars. Do you pay more than the minimum? *(closing question, on screen too)*

## Maths (checked 5 Nov 2026 with a month-by-month simulation)
Assumptions (on screen as a MATH chip): 22.15% APR, minimum = 1% of balance + that month's interest, $35 floor, no new charges or fees.
- First payment: $30 (1%) + $55.38 interest = **$85.38** → "85 dollars, 55 of it interest, 30 touches the debt".
- Minimum-only path: **146 months = 12.2 years**, total paid **$7,039** ("over 12 years", "over 7,000").
- With a $25 floor instead: 15 years, $7,467 (the claims stay true).
- 36-month payment: **$114.80**, total **$4,133** → saves **$2,906** ("about 2,900"), 9.2 years sooner ("9 years sooner").

## Sources
- Fed G.19 (released 7 Oct 2026, Q2 2026): credit card rate, accounts assessed interest 22.15%. https://www.federalreserve.gov/releases/g19/current/default.htm
- CFPB: statements must show the 3-year payment and how long minimum payments take. https://www.consumerfinance.gov/ask-cfpb/what-is-the-three-year-payment-information-on-a-credit-card-statement-en-36/
- TD Bank: common minimum-payment formula (1% of balance + interest and fees). https://www.td.com/us/en/personal-banking/learning/what-is-a-minimum-payment-on-a-credit-card

## Who would someone send this to?
The friend who always pays "just the minimum", or a younger sibling with a first credit card.

## Build
Composition `Look2D` (routes `money5` to `src/toon2d/card/CardVideo.tsx`; scenes in `card/scenes.tsx`, labels in `card/overlays.tsx`). Shots: desk (hook, bridge) → CARD CO. machine (split, rate) → treadmill (shrink) → cash towers (total) → desk (exit, final). The camera reframes on every phrase (Tavinho lesson).

---

# (Old series brief, kept for reference)

# EP 5/6: "The minimum payment trap"

Series: MONEY, EXPLAINED. The series plan is in `videos/money1/BRIEF.md`.

## Facts and assumptions (all checked 3 Nov 2026)

| Claim in the script | Source / maths | Notes |
|---|---|---|
| A 22% card rate | Federal Reserve G.19, released 7 Oct 2026, Q2 2026: commercial bank interest rate on credit card plans, **accounts assessed interest = 22.15%** (all accounts 20.94%). https://www.federalreserve.gov/releases/g19/current/default.htm | "Accounts assessed interest" = people who carry a balance, which is Jake's case. Script: "charges 22 percent a year". |
| How minimum payments are calculated | TD Bank, "What is a minimum payment on a credit card?": common methods include "1% of your principal balance plus interest charges and fees", a small percentage of the balance, or a flat floor (e.g. $25). The exact formula is in your card agreement and statement. https://www.td.com/us/en/personal-banking/learning/what-is-a-minimum-payment-on-a-credit-card | **Our assumption:** minimum = 1% of balance + that month's interest, with a floor of $25–$35, no new purchases and no fees. Shown on screen as a small assumption chip. |
| $3,000 at the minimum takes over 12 years and costs over $7,000 in total | Our simulation (monthly interest = 22.15% ÷ 12):<br>- **$35 floor:** 146 months = **12.2 years**, total paid **$7,039**, interest $4,039.<br>- **$25 floor:** 180 months = 15.0 years, total $7,467.<br><br>Both floors give "over 12 years" and "over 7,000 dollars". | Conservative wording, true under either floor. Method, to re-run: each month, interest = balance × 0.2215 ÷ 12; payment = max(1% of balance + interest, floor), capped at the balance + interest; repeat until the balance is 0. |
| First payment $85, of which $55 is interest | $3,000 × 22.15% ÷ 12 = **$55.38** interest; + 1% × $3,000 = $30 → **$85.38** minimum. | "Only $30 touches the debt" (on screen). |
| As the debt shrinks, so does the minimum | Follows from a percentage-of-balance minimum (TD Bank, above). | |
| The exit is printed on the statement: about $115 a month clears it in 3 years | CFPB, "What is the three-year payment information on a credit card statement?": statements must show "how much you need to pay each month to pay off your current balance in 36 months" and how long minimum payments would take. https://www.consumerfinance.gov/ask-cfpb/what-is-the-three-year-payment-information-on-a-credit-card-statement-en-36/. Our maths: the 36-month payment on $3,000 at 22.15% = **$114.80**; total ≈ **$4,133** (saves ≈ **$2,906** vs the $35-floor minimum path). | Spoken "about 115 dollars a month… 3 years". On screen: "SAVES ≈ $2,900". |
| "If you make only the minimum payment, it could take years" | CFPB, same page. | Supports the premise. |

## Angle
- **Fear plus relief.**
- **Outcome first:** "It'll take over 12 years."
- **The mechanism made visible:** $85 payment, $55 eaten by interest, then the shrinking-minimum treadmill.
- **Mid CTA at the scariest moment.**
- **The fix is printed on your own statement** (CFPB's 3-year box): a practical tip anyone can check today.
- **Hook into EP6:** "Interest worked against Jake. Next, it works for him."

## Who would someone send this to?
**The friend who always pays "just the minimum"**, or **a younger sibling who just got their first credit card**.

## Why it should perform
- **Outcome-first specific number** (rule 9: "specific number" and "outcome first" formulas). The first frame shows the payoff: "12+ YEARS" on the card screen.
- **Fear** is a high-arousal, highly shared emotion, followed by **practical value** (the box on your statement) (rule 3).
- **A "you" connection:** almost everyone has a card (rule 2).
- **Show the proof on screen** (viral refs rule 13): the pie slice of each payment and the treadmill.

## Script (97 words, ~31 s)
1. Jake pays the minimum on his 3,000 dollar credit card. It'll take over 12 years.
2. In total, he'll pay over 7,000 dollars, because his card charges 22 percent a year.
3. His first payment is 85 dollars. But 55 of that is interest.
4. Worse: as the debt shrinks, so does the minimum. So it drags on, and on.
5. Episode 5 of 6. Follow along.
6. The exit is printed on his statement: about 115 dollars a month clears it in 3 years.
7. Interest just worked against Jake. Next, it works for him. Do you pay your card in full?

## SCRIPT_RULES checklist (final)
- [x] **Who it's sent to:** the "just the minimum" friend, or a sibling with a first card.
- [x] **First frame:** Jake at the desk with his phone's card app showing "MINIMUM DUE $85" and a big red "12+ YEARS" stamp. **Hook line:** "Jake pays the minimum on his 3,000 dollar credit card." (10 words; contains "minimum" and "credit card"). On screen "MINIMUM PAYMENTS ON $3,000 / = OVER 12 YEARS" matches the spoken claim.
- [x] **But/therefore chain:**
  - 12 years → *in total* $7,000 *because* 22%
  - first payment $85, *But* $55 interest
  - *Worse* (but) the minimum shrinks, *so* it drags on
  - CTA
  - the exit (therefore)
  - the ending sets up EP6, then the ask
- [x] **Re-hooks:** "over 12 years" (~3 s), "over 7,000" (~6 s), "But 55 of that is interest" (~11 s), "Worse:" (~13 s), "The exit is printed on his statement" (~19 s), "Next, it works for him" (~26 s). **Visuals:** ≤2 s (SHOTS.md).
- [x] **Numbers made concrete:**
  - a years counter 0 → 12+
  - a $3,000 → $7,000+ "TOTAL PAID" counter
  - an $85 bill split into $55 (red, "INTEREST") and $30 (green)
  - a treadmill that slows down
  - a calendar 3 years vs 12 years
  - "SAVES ≈ $2,900"
- [x] **CTA** mid-video (~17 s of 31), at the treadmill. **Ending:** the punchline "Next, it works for him", then one specific ask ("Do you pay your card in full?"). **Loop:** the final frame is Jake and the card app, as in frame 1, now showing "$115/MO · 3 YEARS".
- [x] **Sources:** the Fed G.19 and CFPB chips on screen, plus the assumption chip "ASSUMES 22% APR · MIN = 1% + INTEREST · NO NEW CHARGES". NOT FINANCIAL ADVICE chip on.
- [x] **Read aloud:** no dotted abbreviations or symbols. "It'll" reads fine. 97 words ≈ 31 s.
- [x] **Cover:** "THE MINIMUM / PAYMENT **TRAP**" with "$3,000 → 12+ YEARS".

## Revision log
- **Pass 1:**
  - "It'll take 12 years" became "over 12 years": true under both the $25 and $35 floors, and conservative.
  - Added a 0.4 s hold on the $85 / $55 split.
- **Hook match:** the on-screen hook changed from "THE MINIMUM PAYMENT / TRAP" (a label) to the claim the voice makes: "MINIMUM PAYMENTS ON $3,000 / = OVER 12 YEARS". The cover keeps "THE MINIMUM PAYMENT TRAP" as the searchable title.
- **Skeptical-editor pass:**
  - "Your numbers depend on the formula. Someone will say 'mine says 9 years'." Added the assumption chip on screen, plus the pinned-comment line "your statement shows your exact numbers" (CFPB). That turns the objection into the video's own advice.
  - "Is 'the exit is printed on his statement' true for every card?" The CFPB says statements must show the 36-month payment, so yes for US credit card statements. Only the dollar figure differs by APR.
  - "Will the ending feel like an ad for EP6?" It works as the punchline: interest flips from villain to hero, and that is the series' turning point. The ask comes last (house pattern), and it's a yes/no vote.
