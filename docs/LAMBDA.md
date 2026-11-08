# Rendering on AWS Lambda (Remotion Lambda)

Each video is split across many small AWS Lambda computers that render at the same time, then stitched back together.
Renders are started from GitHub Actions (workflow **Render on Lambda**), so nothing needs to run on the owner's PC.

- Region: `eu-west-1` (Ireland). Function: 2048 MB, 900 s timeout. Site name: `hootexplains`.
- Cost: AWS gives 400,000 GB-seconds of Lambda free every month. A 2-minute video is roughly 15,000 GB-s (estimate, to be measured), so roughly 25 videos/month free, then about €0.20 each.
- Remotion licence: free for individuals and teams of up to 3.

## One-time setup (owner)
1. **AWS account:** sign up at aws.amazon.com (needs a card). Top-right region: **Europe (Ireland) eu-west-1**.
2. **Budget alert:** Billing → Budgets → Create budget → Monthly cost budget, €15, your email. (AWS has no hard cap; this emails you early.)
3. **Role policy:** IAM → Policies → Create policy → JSON → paste `docs/lambda/role-policy.json` → name it exactly `remotion-lambda-policy`.
4. **Role:** IAM → Roles → Create role → AWS service → Lambda → attach `remotion-lambda-policy` → name it exactly `remotion-lambda-role`.
5. **User:** IAM → Users → Create user `remotion-user` (no console access, no permissions yet).
6. **User policy:** open `remotion-user` → Permissions → Add permissions → Create inline policy → JSON → paste `docs/lambda/user-policy.json` → name `remotion-user-policy`.
7. **Access key:** `remotion-user` → Security credentials → Create access key → "Application running outside AWS". Keep the two values private (never paste them in chat).
8. **GitHub secrets:** repo → Settings → Secrets and variables → Actions → New repository secret:
   - `REMOTION_AWS_ACCESS_KEY_ID` = the access key id
   - `REMOTION_AWS_SECRET_ACCESS_KEY` = the secret
9. **More Lambdas at once:** Service Quotas → AWS Lambda → Concurrent executions (eu-west-1) → Request increase to **1000**. New accounts often start at 10; approval can take a few days.

## Rendering
- Actions tab → **Render on Lambda** → Run workflow → `videos` = `awake1,airplanemode,...`. Or `gh workflow run lambda-render.yml -f videos="awake1,airplanemode"`.
- Each video renders in its own parallel job; results are artifacts on the run page (`<id>.mp4` and `<id>_upload.mp4`, kept 14 days).
- The voice files (`public/videos/<id>/`) must be pushed to GitHub first, because the site is built from the repo.
- `concurrency` input = Lambdas per video. While the account limit is 10: keep `8` and render **one video at a time**. After the increase to 1000: use `100`, and 4+ videos at once is fine.
- Post-processing (-14 LUFS, clean upload copy) runs in the job via `scripts/finish.sh`, same as a local `scripts/render.sh`.
