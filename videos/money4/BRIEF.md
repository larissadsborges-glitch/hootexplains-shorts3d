# money4 (standalone, 2D): "Your bank paid you $38 on $10,000. Here's why."

Rewritten 5 Nov 2026 as a **standalone** video (no "EP n/6", no series teaser, no advice tag). The old series script is `script_series_v1.json`; the series brief below keeps its sources. The owner picked this topic on 5 Nov.

## Titles
- **A (built):** Your bank paid you $38 on $10,000. Here's why.
- B: $10,000 in savings earned him $38. His bank earned 3.9%.
- C: Why does your bank pay you so little?
- **Cover text:** $10,000 SAVED / BANK PAID $38

## Script (117 words, 38.9 s with the 1.8 s tail)
1. This is Jake. He kept 10,000 dollars in his savings for a whole year. His bank paid him 38 dollars. *(intro + who/what in 3 words)*
2. Here's where his money really works, and how he gets ten times more. *(bridge at 5.8 s)*
3. That's the national average, less than half a percent. But prices rose 3.7 percent, so his savings buy less than last year.
4. Meanwhile, his bank earns 3.9 percent, just by parking cash at the Fed, the bank for banks.
5. So why pay Jake so little? Because people don't leave. The average saver keeps the same account for 17 years. *(sendable line)*
6. But some insured savings accounts pay about 4 percent. That's 400 dollars a year, not 38. *(answer)*
7. Same 10,000 dollars, ten times the interest. When did you last check your rate? *(closing question, on screen)*

## Maths
- $10,000 × 0.38% = $38. $10,000 × 3.97% = $397 ≈ $400 (10.4× → "ten times").
- Buying power: $10,038 ÷ 1.037 = $9,680 → "his $10,038 now buys what $9,680 did".

## Sources (all in the table below; checked 3 Nov 2026)
- FDIC national savings rate 0.38% (Oct 2026), via FRED SNDR: https://fred.stlouisfed.org/series/SNDR
- BLS CPI-U +3.7% for the 12 months to Sept 2026: https://www.bls.gov/news.release/cpi.nr0.htm
- Fed interest on reserve balances 3.90%, via FRED IORB: https://fred.stlouisfed.org/series/IORB
- Bankrate survey (Jan 2025): average 17 years with the same savings account: https://www.bankrate.com/press-releases/bank-account-holders-stick-with-same-accounts-for-decades/
- Bankrate top savings offers 3.97% APY (3 Nov 2026): https://www.bankrate.com/banking/savings/savings-apys-are-still-high
- FDIC deposit insurance: https://www.fdic.gov/resources/deposit-insurance

## Look (owner: vary sets and outfits)
New sets: bank lobby (BIG BANK), supermarket aisle, street with BIG BANK and THE FED, living-room couch, two coin jars. Jake wears a mustard jacket over a white tee (`jacket` option on `JakeStanding` / `Jake2D`) and a "HELLO, I'M JAKE" sticker on "This is Jake." Code: `src/toon2d/savings/`.

---

# (Old series brief, kept for reference)

# EP 4/6: "Why does your bank pay you so little?"

Series: MONEY, EXPLAINED. The series plan is in `videos/money1/BRIEF.md`.

## Facts (all checked 3 Nov 2026)

| Claim in the script | Source | Notes |
|---|---|---|
| $10,000 for a year at the national average earns $38 | **FDIC national rate, savings: 0.38%** for Oct 2026 (also 0.37–0.38% every month since June 2026). FRED series SNDR, source FDIC, updated 19 Oct 2026: https://fred.stlouisfed.org/series/SNDR. Our maths: $10,000 × 0.38% = **$38**. | Assumes the rate holds all year (it's been flat at ~0.38%). FDIC's own page (fdic.gov/national-rates-and-rate-caps) blocked our fetch, so FRED's copy of the FDIC series is used. |
| Prices rose 3.7% → he lost buying power (about $320) | BLS CPI release, 14 Oct 2026: CPI-U +3.7% for the 12 months to Sept 2026. https://www.bls.gov/news.release/cpi.nr0.htm. Our maths: $10,038 ÷ 1.037 = $9,679.85, so **≈ $320 of buying power lost**. | On screen: "−$320 BUYING POWER". Same re-check note as EP3: update if the October CPI changes. |
| His bank can earn 3.9% just parking money at the Fed | **Interest on reserve balances (IORB) = 3.90%**, 3 Nov 2026. FRED IORB, updated 2 Nov 2026: https://fred.stlouisfed.org/series/IORB. Effective fed funds rate 3.88% (Oct 2026). | IORB is what the Fed pays banks on reserves held at the Fed: effectively risk-free for the bank. On screen: "FED PAYS BANKS 3.90% ON RESERVES". |
| Why so little? People stay: the average saver keeps the same savings account for 17 years | Bankrate survey (fieldwork 27–29 Jan 2025; 2,712 US adults, 1,806 with savings accounts): average **17 years** with the same savings account (18 at branch banks, 6 at online-only). https://www.bankrate.com/press-releases/bank-account-holders-stick-with-same-accounts-for-decades/ | Industry survey (medium confidence), but a clear, specific number. **Academic backing for "banks pay little because they can":** Drechsler, Savov & Schnabl, "The Deposits Channel of Monetary Policy" (QJE 2017; NBER w22152) find banks have "market power in deposit markets" and widen deposit spreads when rates rise. https://www.nber.org/papers/w22152 |
| Some insured savings accounts pay about 4% | Bankrate, as of 3 Nov 2026: average of top savings offers from the institutions it tracks = **3.97% APY**, vs a 0.57% national average (Bankrate's own measure). https://www.bankrate.com/banking/savings/savings-apys-are-still-high | **Secondary source (medium confidence),** but consistent with the IORB 3.90% and fed funds 3.88% above. Script says "some… about 4 percent". $10,000 × 3.97% = $397 → "400 dollars". |
| "Insured" | FDIC: "The standard insurance amount is $250,000 per depositor, per insured bank, for each account ownership category." https://www.fdic.gov/resources/deposit-insurance | On screen: "CHECK: FDIC OR NCUA INSURED". |
| Banks charge about 22% on credit cards | Federal Reserve G.19, released 7 Oct 2026, Q2 2026: commercial bank interest rate on credit card plans, **accounts assessed interest = 22.15%** (all accounts 20.94%). https://www.federalreserve.gov/releases/g19/current/default.htm | This sets up EP5. |

## Angle
- **Outrage plus practical value.** Jake's $10,000 earned $38, while his bank can earn 3.9% parking money at the Fed.
- **Why:** people stay put for 17 years, and banks know it.
- **Twist:** some insured accounts pay ~10× more.
- **The principle is "compare your rate"**, with no product or bank names.
- **Ending:** the same banks charge 22% on cards (→ EP5), then the ask: "Do you know your savings rate?"

## Who would someone send this to?
**The friend who has kept the same savings account since college**, or **a parent with savings at a big bank**. The share is useful: "check your rate".

## Why it should perform
- **High-arousal outrage** (0.38% vs 3.9%) is among the most-shared emotions (rule 3; Berger & Milkman).
- **Practical value** you can act on today (rule 3). Save rates for practical lists are the highest of all formats (viral refs rule 26).
- **A "you" question as the hook** with the title phrase (rule 9). The payoff number is on screen in the first frame (the statement shows "+$38.00").
- **A concrete A-vs-B:** $38 vs $400 (viral refs rule 7).

## Script (103 words, ~33 s)
1. Why does your bank pay you so little? Jake saved 10,000 dollars for a whole year. He earned 38.
2. That's the national average rate. But prices rose 3.7 percent, so he really lost buying power.
3. Meanwhile, his bank can earn 3.9 percent just parking money at the Fed.
4. Why pay Jake so little? Because people stay. The average saver keeps the same savings account for 17 years.
5. Episode 4 of 6. Follow along.
6. But some insured savings accounts pay about 4 percent. That's 400 dollars instead of 38.
7. And banks charge about 22 percent on credit cards. Do you know your savings rate?

## SCRIPT_RULES checklist (final)
- [x] **Who it's sent to:** the friend with a college-era savings account, or the parent at a big bank.
- [x] **First frame:** Jake stares at a bank statement reading "INTEREST EARNED: $38.00" on $10,000. **Hook line:** "Why does your bank pay you so little?" (8 words, title phrase). On screen "WHY DOES YOUR BANK / PAY YOU SO LITTLE?" matches.
- [x] **But/therefore chain:**
  - so little → $38
  - *But* prices rose → he lost (stakes)
  - *Meanwhile* (but) the bank earns 3.9%
  - *Why?* (loop) → *because* people stay (answer)
  - CTA
  - *But* some pay 4% (twist)
  - *And* 22% on cards (new loop into EP5) → ask

  A loop is open at every moment: why little? → why does the bank get more? → what can I do? → what about cards?
- [x] **Re-hooks:** "He earned 38" (~4 s), "he really lost" (~9 s), "Meanwhile… 3.9 percent" (~11 s), "Because people stay" (~16 s), "But some… 4 percent" (~22 s), "22 percent" (~27 s). **Visuals:** a change every ≤2 s (SHOTS.md).
- [x] **Numbers made concrete:**
  - statement $38
  - a −$320 red buying-power counter
  - two side-by-side bars, 0.38% vs 3.90%
  - a 17-year calendar flip
  - a $38 vs $400 coin-stack comparison
  - a 22% card tag
- [x] **CTA** mid-video (~21 s of 33). **Ending:** the punchline "22 percent on credit cards", then one specific ask ("Do you know your savings rate?"). **Loop:** the final shot is the statement on Jake's desk, as in frame 1.
- [x] **Sources:** all sourced; chips "SOURCE: FDIC", "SOURCE: FEDERAL RESERVE", "SOURCE: BANKRATE SURVEY 2025". **NOT FINANCIAL ADVICE** chip on throughout. No bank or product names.
- [x] **Read aloud:**
  - "0.38" is never spoken ("national average rate"; the number is on screen)
  - no dotted abbreviations or symbols
  - "Fed" is spoken as a word
  - 103 words ≈ 33 s
- [x] **Cover:** "WHY DOES YOUR BANK / PAY YOU SO **LITTLE**?" with the chip "0.38% vs 3.9%".

## Revision log
- **Pass 1:**
  - "Do you know your rate? Because next, the same banks charge 22 percent." became "And banks charge about 22 percent on credit cards. Do you know your savings rate?" The ask moves last (house pattern), and "same banks" became "banks" (G.19 is all commercial banks, not literally Jake's bank).
  - "sits put for 17 years" became "The average saver keeps the same savings account for 17 years" (clearer, and true to the survey wording).
- **Hook match:** added the title phrase as the spoken hook. The payoff ($38) follows in the same beat, with a 0.3 s hold.
- **Skeptical-editor pass:**
  - The editor challenged "his bank can earn 3.9 percent just parking money at the Fed": "Does every bank? Is it his money?" IORB is paid to banks on reserve balances, and most banks hold reserves. The line says "can earn" and "parking money" (not "his money"), so it's accurate.
  - The editor asked to say "320 dollars" out loud. Kept it on screen only: it would add a fourth number in 5 s, and the voice already says "lost buying power". The red counter makes it concrete.
  - The editor flagged the "about 4 percent" source as non-government. Kept it, flagged as secondary in this brief, and phrased as "some…about". The government series (IORB 3.90%) supports the level.
