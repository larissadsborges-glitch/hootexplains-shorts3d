# Hoot Explains: game plan (research from the night of 3–4 Nov 2026)

How to get more reach, better 3D quality, fewer mistakes and lower token use. It builds on the growth playbook and the competitor scan. Lower-confidence claims (vendor blogs, single Reddit posts) are marked *(low)*.

---

## 1. What makes these videos spread (research summary)

**Data that holds up**
- **The first second decides most of it.** Paddy Galloway's study of 3.3B views across 5,400 Shorts found that Shorts under 60% "viewed vs swiped away" rarely did well, and the best sat at 70–90%. His advice: treat the first second like a thumbnail. ([thread](https://threadreaderapp.com/thread/1646898356419981315.html))
- **Watch time beats length.** In the same study, Shorts with an average view duration above 50 s averaged 4.1M views. Holding attention matters more than how long the video is.
- **Instagram ranks shares highest.** Sends per reach is the signal Mosseri has stressed most in 2025–26 for reaching non-followers.
- **Hook type (TikTok, 34,635 clips, Jan–Mar 2026).** Showing the outcome in the first frame averaged about 2× the views of the weakest hook type. "Expert explainer" openers ("I've reviewed 400…") were the most common. ([Opus](https://www.opus.pro/blog/tiktok-hooks-that-go-viral-2026))

**Creator reports (Reddit r/InstagramMarketing, Apr 2026)** *(low: anecdotal)*
- A strategist ranks Reels signals as **skip rate first** (share of viewers leaving in the first 3 s; aim for about 20%), then share rate, then like rate. Several commenters agree weak first 2 seconds sink a video; others disagree that the order is fixed. ([post](https://reddit.sentinel-team.org/posts/1ssgq3f/snapshots/2026-04-23T04%3A55%3A57.655277Z))
- A 380K-follower page stopped posting for 2 weeks and still gained 4,200 followers, because old reels got a second wave. **The back catalogue keeps working.**
- Many small pages report falling reach: "go viral or stay irrelevant now". Content either breaks out to non-followers or stays small.
- Comment-bait CTAs are falling out of favour. Value that people want to share works better.

**Retention mechanics** *(low: playbook article, consistent with the above)*
- **Pacing:** something visibly changes every **1.5–2 s** (a cut, camera move, text swap or counter). Under 1.2 s reads as noise; over 2.5 s retention dips.
- **Drop-off:** typically 30–50% leave in the first 3 s, then another 15–25% by 10 s.
- **Loop ending:** the last frame visually matches the first, which creates rewatch spikes.
- **Remove all preamble:** no logo card, no greeting. Captions are on screen from the first second, since 60–80% watch muted.
- **Length:** 20–35 s is the easiest to keep above 80% average viewed; past 45 s, holding 80% is hard. Educational and list formats can hold 85–95%.

**Jenny Hoyos's Shorts method** (1.6B views across 124 Shorts, ~13M average per video) ([Demand Curve teardown](https://www.demandcurve.com/newsletters/growth-newsletter-187))
- **Start mid-action, with no preamble,** and don't narrate what the picture already shows.
- **Structure:** hook, then stakes that make the goal seem impossible, then restate the premise to re-hook, then a body with drama and a "mistake", then the payoff.
- **Put the CTA in the middle, at peak action,** not at the end: viewers leave right after the payoff.
- **Before the reveal,** restate the question ("…is it going to be less than a dollar?") and hold a beat of doubt.
- **End abruptly on the high point.** Lingering after the payoff kills rewatches.
- **Applied to us:** move "follow for day 2" to mid-video (around hour 17), cut the outro tail, and end on the punchline.

**Trial reels** *(mixed evidence)*
- Instagram says 80% of creators who post more trial reels saw higher non-follower reach.
- Independent tests are tiny. Trials usually get **less** reach than normal reels, so compare trials only with other trials, change one variable at a time, and judge over weeks. ([Planoly](https://www.planoly.com/blog/do-trial-reels-work-research))

**AI label rule (Instagram, 1 Sep 2026)**
- Accounts whose **central identity is an AI-made person** (virtual influencers, synthetic people presented as real creators) must turn on "AI-generated profile". Unlabelled ones lose recommendations.
- AI used as a tool doesn't trigger it, and the rule doesn't clearly cover an obviously cartoon mascot.
- **Our position:** Hoot is a cartoon owl, not a fake human creator, so we're likely outside the rule. To be safe, keep the bio honest ("animated explainers") and never present Jake as a real person. ([Khaleej Times](https://www.khaleejtimes.com/business/tech/instagram-ai-generated-profile-label-reach-restrictions))

---

## 2. Changes to our videos (in priority order)

1. **The first frame is the thumbnail.** It shows the outcome or payoff (Jake asleep on his desk at hour 24, not an empty room), with the question in big text and captions already on.
2. **A visual change every ~2 s.** Add a beat-change rule to every scene timeline: camera push, new label, counter tick or Jake's expression. Our long static desk shots break this.
3. **Shorter cuts to test:** make a 30–35 s version of each video next to the full one and post the short one as a trial reel. Keep whichever wins on stayed-to-watch or skip rate.
4. **Loop endings:** the last shot returns to the first framing (Jake at the desk), so the loop is seamless.
5. **Built to be shared:** every script names a person to send it to ("send this to the friend who pulls all-nighters"), and the caption repeats it.
6. **Drop comment bait as the main CTA.** Use one specific CTA ("follow for day 2") and let the value do the sharing.
7. **Post 3–5 a week** and reuse winners: hits keep getting second waves.

---

## 3. Better 3D quality and fewer mistakes

**Findings**
- **Rigged character models are available.** The three.js repo on GitHub (which this workspace can reach) has **RobotExpressive.glb** (CC0, by Quaternius) with walk, run, idle, sit, wave, thumbs up and jump animations plus facial expressions (angry, surprised, sad). It also has Mixamo humans (Soldier, Xbot, Michelle; Adobe Mixamo licence: free to use in videos). Quaternius, Poly Pizza and Kenney's sites are blocked from here, but the user's PC can download them.
  - **Plan:** move Jake to a rigged glTF human with real joints and animation clips, played frame by frame with `AnimationMixer.setTime(frame / fps)`. This fixes stiff tube arms, hands that miss objects and impossible poses. Test it on the PC first.
- **drei 9.122 and postprocessing 2.19 are compatible** with our three r169 + fiber 8 + React 18. Useful pieces:
  - `ContactShadows` to ground characters (costs a depth pass)
  - `Outlines` for a cartoon edge that makes characters readable on phones; cheap, no post-processing needed
  - `RoundedBox` for smoother props
  - N8AO (ambient occlusion) and bloom are heavy under software rendering, so only use them on the GPU PC
- **Remotion's own guidance:** never animate with `useFrame` (we already follow this). Render with `--gl=angle` on a GPU, use JPEG frames, and pick concurrency with `npx remotion benchmark`. Split long renders, because angle has memory leaks. ([gl options](https://www.remotion.dev/docs/gl-options), [performance](https://remotion-51rkqgyxg-remotion.vercel.app/docs/performance))
- **Hand-drawn annotations** (`@remotion/rough-notation`) are now installed and used for the circled key numbers.

- **Lip sync:** Rhubarb Lip Sync (MIT licence) downloads from GitHub releases here (tested: v1.13.0 for Linux, 87 MB). It turns the voice track into proper mouth shapes (closed, open, wide, "oo" and so on), which is better than our loudness-only beak. Worth it once a human character talks on screen.

**Automated checks to build** (they catch mistakes before rendering and save review rounds)
1. **Frame-edge check:** each frame, project every character's bounding box to the screen and warn if Hoot or Jake is cut off.
2. **Label layout check:** measure every pill and headline box and warn on overlaps, text past the 5–95% safe width, or text over a character's face (by projecting the head position).
3. **Contact check:** warn if a held object is more than ~3 cm from the hand, or a character's hips sit inside furniture.
4. **Timing check:** warn if a label is shown for under 1.5 s, or a counter runs backwards.
5. Run these on the contact-sheet frames (0.5 s steps) before any full render. Most of tonight's review findings would have been caught automatically.

---

## 3b. Money test video: what works in finance shorts
- **Formats:** side-by-side comparisons (investing $200 a month from age 25 vs 35), myth-busting, "3 things your bank won't tell you" lists, and short step guides.
- **Keep jargon out of the first 5 s.** Teach principles, never recommend specific stocks or crypto, and add a "not financial advice" line.
- **No luxury flexing.** It reads as a credibility red flag.
- Source: [Fluxnote finance Reels guide](https://fluxnote.io/guides/instagram-reels-finance-niche-2026) *(low)*.
- **First test idea:** "Jake spends $6 a day on coffee. Here's what it costs him by 40", with a money counter racing, the 25-vs-35 comparison and a twist at the end.

## 4. Using fewer tokens

- **Images cost the most.** Use one contact sheet at low resolution per check instead of many full frames, and look closely only at the shots that changed.
- **Run the automated checks first**, so only flagged frames need eyes.
- **Render and test on the PC GPU:** about 3–6× faster renders mean fewer progress checks and fewer render-and-fix rounds.
- **Reuse scenes:** keep a library of rooms, the plane, the cabin and characters. Every new scene from scratch costs thousands of tokens.
- **Send previews early** (a 10 s preview) so direction changes happen before the full build.
- **Keep the learnings file and skill up to date,** so new sessions don't repeat mistakes.
- **Use review agents only for the final pass,** with a tight brief and a capped report.

---

## 5. Next steps (in order)

1. Deliver sleep Episode 1, then wait for the user's next step.
2. When the user is at the PC: link it, install Node, copy the project, benchmark `--gl=angle` on the GTX 1050, and download CC0 rigged characters.
3. Build the automated QA checks (section 3).
4. Prototype a rigged-glTF Jake with outlines and contact shadows, and compare it with the current Jake in one still.
5. Money test video (a Jake money decision with counters).
6. A/B trial reels: 30 s vs full-length cut, and hook variants.
