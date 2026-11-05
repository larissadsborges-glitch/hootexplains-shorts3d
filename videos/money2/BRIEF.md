# money2 (standalone, 2D): "Jake's bank created $20,000 out of thin air"

Rewritten 5 Nov 2026 as a **standalone** video (no "EP n/6", no inflation teaser, no advice tag). The old series script is `script_series_v1.json`; the sources are in the table below. Topic picked by the owner on 5 Nov.

## Titles
- **A (built):** Jake's bank created $20,000 out of thin air
- B: Your bank doesn't lend out savings. It types new money.
- C: Most money isn't printed. It's typed.
- **Cover text:** HIS BANK MADE / $20,000 FROM NOTHING

## Script (98 words, 31.3 s with the 1.8 s tail)
1. Jake just borrowed 20,000 dollars for a car. His bank didn't lend him anyone's savings. It created the money.
2. Here's how a bank makes money from nothing, and why it can't do it forever. *(bridge at 6.1 s)*
3. When the loan is approved, the bank just types 20,000 into his account. Brand new money.
4. Not a conspiracy theory. The Bank of England explained it in 2014. *(sendable line)*
5. But there's a catch. When Jake pays the loan back, that money disappears.
6. And banks need borrowers who'll repay, while the Fed steers what borrowing costs.
7. So most money isn't printed. It's typed. Did you know your bank could do that? *(closing question, on screen)*

## Sources (table below)
- Bank of England, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1: a loan creates a matching deposit; repayment destroys money; most money is created by commercial banks making loans; limits = profitable lending and the central bank's policy. https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy
- St. Louis Fed (2021): the textbook money multiplier is obsolete (for comment replies). https://fedinprint.org/item/fedlpo/93181
- FRED FEDFUNDS 3.88% (Oct 2026) for the on-screen "FED RATE ≈ 3.9%". https://fred.stlouisfed.org/series/FEDFUNDS
- The $20,000 car loan is an illustrative amount.

## Look (owner: vary sets and outfits)
Sets: car lot, giant bank app screen, the Bank of England bulletin on a corkboard, a "borrowing cost" dial in front of THE FED. Jake wears a green jacket. Code: `src/toon2d/loan/`.

---

# (Old series brief, kept for reference)

# EP 2/6: "Banks create money out of thin air"

Series: MONEY, EXPLAINED. The series plan, order and branding are in `videos/money1/BRIEF.md`.

## Facts (all checked 3 Nov 2026)

| Claim in the script | Source | Notes |
|---|---|---|
| A bank loan creates new money; the bank doesn't lend out someone's savings | Bank of England, McLeay, Radia & Thomas, "Money creation in the modern economy", Quarterly Bulletin 2014 Q1:<br>- "Whenever a bank makes a loan, it simultaneously creates a matching deposit in the borrower's bank account."<br>- "banks do not act simply as intermediaries, lending out deposits that savers place with them"<br>- "the majority of money in the modern economy is created by commercial banks making loans"<br>Article: https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy<br>PDF: https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2014/money-creation-in-the-modern-economy.pdf | "Out of thin air" is our plain-language phrase for "creates a matching deposit". The loan is also an asset on the bank's books, so nothing illegal or magic is implied. Spoken: "Not a conspiracy theory. The Bank of England published it." |
| US support for the same view | Federal Reserve Bank of St. Louis, Ihrig, Weinbach & Wolla, "Teaching the Linkage Between Banks and the Fed: R.I.P. Money Multiplier", Page One Economics, 17 Sep 2021: the textbook money multiplier is "obsolete". https://fedinprint.org/item/fedlpo/93181 | Background for comment replies. |
| When the loan is repaid, that money disappears | Bank of England (same paper): "the repayment of bank loans destroys money". | |
| Limits: borrowers must repay (profitability) and the central bank steers the cost of borrowing | Bank of England (same paper):<br>- "banks have to be able to lend profitably in a competitive market"<br>- "the amount of money created … ultimately depends on the monetary policy of the central bank", mainly through interest rates<br>- regulation is a further constraint | Spoken: "they need borrowers who'll repay, and the Fed steers what borrowing costs". |
| The Fed steers rates (context) | Effective federal funds rate 3.88%, Oct 2026 (FRED FEDFUNDS, updated 2 Nov 2026). https://fred.stlouisfed.org/series/FEDFUNDS | On-screen dial only: "FED RATE ≈ 3.9%". |
| More money than stuff to buy → prices tend to rise | A standard textbook principle, hedged as "tend to". It sets up EP3, where it's measured with BLS CPI. | **Simplification:** inflation has many causes (supply shocks, energy and so on). "Tend to" is deliberate. |
| $20,000 car loan | An illustrative amount (Jake's story), not a statistic. | |

## Angle
- **The single most "no way" fact in money:** your bank doesn't lend you anyone's savings; it types new money into existence.
- **Story:** Jake gets a car loan.
- **Myth, then truth:** "it lent you someone's savings" → no, it created a deposit.
- **Re-hook:** "So why can't banks make infinite money?"
- **Two catches:** repaying destroys money; there are limits.
- **Cliffhanger into EP3:** prices.

## Who would someone send this to?
**The friend who loves "the system is rigged" videos**, and also the economics-student friend who learned the money multiplier. Both will want to argue in the comments, and both are likely to share.

## Why it should perform
- **A contrarian, high-arousal "no way" fact** (rules 1, 3 and 9). The hook line is an outcome-first statement with the subject on screen.
- **Myth, then truth** (rule 18), plus an authority twist ("not a conspiracy theory: the Bank of England published it"). That makes viewers look smart when they share it (social currency).
- **Proven appetite:** "doesn't work how you think" titles are a proven pattern (competitor scan, pattern 3). Money A-vs-B and myth topics are among the reference pages' top hits (viral refs rules 7 and 10).
- **Series episode** with an "EP 2/6" chip and a cliffhanger into EP3.

## Script (103 words, ~32 s)
1. Jake's bank just created 20,000 dollars out of thin air.
2. You'd think it lent him someone's savings. Nope.
3. When it approves his car loan, the bank just types 20,000 into his account. Brand new money.
4. Not a conspiracy theory. The Bank of England published it.
5. Episode 2 of 6. Follow along.
6. So why can't banks make infinite money? Two catches.
7. One: when Jake pays the loan back, that money disappears.
8. Two: they need borrowers who'll repay, and the Fed steers what borrowing costs.
9. But when money grows faster than the stuff to buy, prices tend to rise. Did you know banks did this?

## SCRIPT_RULES checklist (final)
- [x] **Who it's sent to:** the "system is rigged" friend and the econ-student friend.
- [x] **First frame:** Jake's banking app jumps from $0 to $20,000 with sparkles. **Hook line:** "Jake's bank just created 20,000 dollars out of thin air." (10 words; title phrase "create money out of thin air"). On screen "BANKS CREATE MONEY / OUT OF THIN AIR".
- [x] **But/therefore chain:**
  - created? → *you'd think* savings, *Nope* (but)
  - *so* how: it types it
  - proof (therefore)
  - CTA
  - *So why can't…* infinite? (re-hook)
  - catch 1 (repay destroys)
  - catch 2 (limits)
  - *But* prices rise (new loop into EP3)

  A loop is open at all times: how? → proof? → why not infinite? → what happens to prices?
- [x] **Re-hooks:** "Nope" (~3 s), "Not a conspiracy theory" (~11 s), "So why can't banks make infinite money?" (~16 s), "that money disappears" (~19 s), "But… prices" (~25 s). **Visuals:** a change every ≤2 s (SHOTS.md).
- [x] **Numbers made concrete:**
  - $20,000 balance counter from $0
  - a car appears
  - the balance drains to 0 with a "POOF" on repayment
  - Fed dial
- [x] **CTA** at ~14 s of 32, right after the proof reveal. **Ending:** a punchline cliffhanger plus one specific yes/no ask. **Loop:** the last shot returns to the app balance from frame 1.
- [x] **Sources:** every claim (BoE, St. Louis Fed, FRED). Source chip "SOURCE: BANK OF ENGLAND (2014)". NOT FINANCIAL ADVICE chip on throughout.
- [x] **Read aloud:** no dotted abbreviations, no symbols. 103 words ≈ 32 s.
- [x] **Cover:** twist statement "BANKS CREATE MONEY / OUT OF / **THIN AIR**".

## Revision log
- **Pass 1:**
  - "Approve his car loan, and the bank…" read like an order. Now "When it approves his car loan, the bank just types…".
  - Added a 0.4 s hold after "Brand new money" so the counter finishes.
  - "prices rise" became "prices **tend to** rise" (inflation has several causes).
- **Skeptical-editor pass:**
  - "Not a theory. The Bank of England says so." felt weak to the editor, and a US viewer may shrug at a British source. Now "Not a **conspiracy** theory. The Bank of England **published** it." It names the viewer's suspicion and flips it, and "published" stresses that it's official and public.
  - The editor asked for a US source on screen too. Added "ALSO: ST. LOUIS FED (2021)" as a second line on the source chip, and in the post kit.
  - The ending's ask ("Did you know banks did this?") comes after the EP3 setup line. Kept that order: the setup line is the cliffhanger, and the yes/no vote is the single closing ask (rule 23). The outro card says "DID YOU KNOW / BANKS DO THIS?", and the "EP 3" pill carries the teaser.
  - The editor's question: is "infinite money" an exaggeration? It's a question the viewer asks, answered with "Two catches", so it's fine.
