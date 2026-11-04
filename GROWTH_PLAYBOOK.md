# Hoot Explains: growth playbook (researched 3 Nov 2026)

What the platforms reward right now, and how we apply it. Third-party numbers are marked as such; platforms publish few official thresholds. Update this as our own analytics come in.

## 1. What each platform ranks on

**YouTube Shorts**
- **The first-seconds decision is everything.** Studio shows "Stayed to watch" (viewed vs swiped away): the % of viewers who stayed past the first seconds. A low score means a problem with the first frame, first line or topic clarity; later drop-off means a body problem. ([Prepublish](https://prepublish.ai/blog/viewed-vs-swiped-away-youtube-shorts))
- **Views vs engaged views:** "views" now counts every start or replay; "engaged views" counts only those who stayed. Judge by engaged views and stayed-to-watch.
- **Benchmark against ourselves:** no official threshold exists. Take the median stayed-to-watch of our last 10–20 Shorts and compare each new one to it.
- **Length:** in a survey of 507 creators (Adobe Express, June 2026), under 30 s was most often named best for views (53%) and shares; 30–60 s tied with under 30 s for subscriber growth (34% each). ([Adobe](https://www.adobe.com/express/learn/blog/youtube-shorts-length-study))

**Instagram Reels**
- **Shares matter most:** sends per reach ("send this to…") is what Mosseri has emphasised most in 2025–26, especially for reaching non-followers. Watch time is "one of many signals". ([Socialync summary](https://www.socialync.io/blog/adam-mosseri-shares-instagram-algorithm-2026))
- **Originality:** reposts carrying a TikTok watermark are pushed down. Always upload our clean file, never a TikTok download.
- **Trial reels:** shown only to non-followers. Toggle "Trial" before sharing, read insights after 24 h, and compare trials only with other trials. Instagram can auto-share a winner to followers within 72 h. This is our free A/B test for hooks. ([Buffer](https://buffer.com/resources/instagram-trial-reels/))

**TikTok**
- **Completion and early hold:** a "qualified view" is more than 5 s. Hook in the first 2–3 s. ([Sprout Social](https://sproutsocial.com/insights/tiktok-algorithm/))
- **Shares and saves** outweigh likes.
- **Search counts:** TikTok reads spoken words (auto-captions) and on-screen text. Say and show the search phrase, e.g. "airplane mode".
- **Length:** over 1 minute is tied to Creator Rewards eligibility, but viral hits are usually under 90 s.
- **Cadence:** 3–4 strong videos a week beats daily low-effort posts.

## 2. Turning views into followers
- **Series convert better.** One cited figure is 67% higher subscriber conversion than standalone Shorts (vendor-cited). Name the series on screen, keep voice, look and pacing identical, and post on a schedule. ([Virvid](https://virvid.ai/blog/turning-shorts-views-into-subscribers-2026))
- **Strong identity:** consistent voice, palette, caption font and mascot. Cited conversion is ~0.5% for weakly branded channels vs 3%+ for strongly branded ones. Hoot is our identity, so use him in every first frame.
- **CTAs:** at most two per video, and specific ("follow for Day 2"), not "follow for more". Add an on-screen overlay for viewers without sound, and repeat the reason in the caption.
- **Platform average:** ~1.7 new subscribers per 100 views on YouTube. Track subscribers per 1,000 views for every Short and repeat what converts.
- **YouTube:** pin a comment with a link to the next part or a playlist, and add the same link to the description.

## 3. Our rules from this (apply to every video)
1. **The first frame is the thumbnail and the hook.** Hoot plus the subject, with text that makes the promise, and no greeting.
2. **Spoken and on-screen keywords:** the title phrase is said in the first sentence and shown on screen (TikTok search).
3. **Built to be shared:** each video needs one "send this to…" person (scared flyer, all-nighter friend) in the caption and ideally in the script.
4. **Length:** 30–45 s for single facts and series episodes; 60–75 s for story topics. Test both and judge by stayed-to-watch.
5. **Test hooks with trial reels:** for each video, post 1–2 trial reels with a different first line or first shot, then keep the winner's pattern.
6. **Schedule:** 3–4 posts a week. Run series episodes on consecutive days and pin "Day 2 is up 👉" in the comments.
7. **Never post a TikTok download to Instagram or YouTube.** Upload the clean master.
8. **Weekly review:** stayed-to-watch, average % viewed, shares per reach, and followers per 1,000 views, logged in the learnings file.

## 4. Tools and skills checked
- **Remotion's official Agent Skills** (`remotion-dev/skills`): best-practice guides for 3D (frame-driven animation only, never `useFrame`), captions, transitions, motion blur (`@remotion/motion-blur`), text highlights (`@remotion/rough-notation`, hand-drawn circles and underlines) and audio. Our pipeline already follows the 3D rules. Worth adopting: rough-notation circles and underlines on key words, and motion blur on fast camera whips. ([Remotion docs](https://www.remotion.dev/docs/ai/skills))
- **Remotion's sound effects library** (`remotion.media`: whoosh, ding, switch and others) and **Whisper word timing**: both blocked by this workspace's network. Our generated sound effects and estimated word timings stay for now.
- **ElevenLabs** (planned, when there's budget): expressive American voice, the biggest remaining quality lever.
- No matching skills in the Claude skills catalogue for video or social media yet.
