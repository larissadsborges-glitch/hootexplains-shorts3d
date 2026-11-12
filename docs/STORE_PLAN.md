# Hoot Explains Shop: plan (12 Nov 2026)

Status: **preview sent for approval.** Nothing is live and no accounts exist yet.

- Preview (live demo page): https://claude.ai/artifact/WNXXCDH8Qy5AdHG48jmNm2
- Local copy of the preview: `store/preview/index.html` (open it in a browser).

## The idea
The shop sells personalised Hoot merch. The customer types a name and it is printed with Hoot, for example "LILY EXPLAINS · how things work". The audience is US parents, teachers and curious people, the same audience as the videos.

## Platform
- **Shopify** (Basic plan) runs the shop, checkout and payments.
- **Printful** (or Printify) handles print-on-demand. It prints and ships each order from the US, so there is no stock to buy.
- Personalisation uses Printful's personalisation tool or a Shopify product-options app, so the customer's name goes onto the print file automatically.

## Launch products
| Product | Price | Print cost (est.) | Profit per sale (est.) |
|---|---|---|---|
| "[Name] Explains" tee (navy, white, teal, sun yellow) | $29 | $12.95 | ≈ $14.90 |
| "Ask [Name]" 11 oz (325 ml) mug | $19 | $7.95 | ≈ $10.20 |
| "Prof. [Name]" 4 × 4 in (10 × 10 cm) sticker | $6 | $2.50 | ≈ $3.00 |
| "[Name]'s Lab" 12 × 16 in (30 × 40 cm) poster | $25 | $12 | ≈ $12.00 |

- The profit column subtracts an estimated card fee of 2.9% + $0.30.
- Shipping is charged to the customer on top.
- **The print costs are estimates from third-party 2026 guides.** Check them in the Printful dashboard before launch.

## Costs
- Shopify Basic: about $29–39 a month (≈ €27–36), plus card fees. Check the Portugal price on shopify.com.
- Printful: free plan. The optional Growth plan (≈ $25 a month) cuts base prices and only pays off with volume.
- Domain: about $15 a year.

## Tax and legal (needs an accountant)
- The owner sells from Portugal, so EU VAT/OSS rules apply.
- Sales to the US may create US sales-tax obligations. Shopify and Printful collect some of it, but get this confirmed before the first sale.
- The shop needs privacy, refund and shipping policies. Shopify can generate drafts.

## Artwork
- `Merch` composition (`src/mascot/Merch.tsx`) renders Hoot on a transparent background. Pose `full` is the whole owl with the pencil; pose `bust` is the winking close-up.
  ```bash
  npx remotion bundle src/index.ts --out-dir=build_store
  npx remotion still build_store Merch out/store/hoot_full.png --image-format=png --scale=2 --props='{"pose":"full"}'
  ```
  On the cloud box, set `REMOTION_BROWSER` as in `scripts/sheet.sh`.
- Print files need about 4500 × 5400 px at 300 dpi for shirts. Render at `--scale=5` and lay out the text in a print template. This is not built yet.

## Launch steps
1. The owner approves the products, prices and the "[Name] Explains" idea.
2. Render print-ready files for each design.
3. The owner creates Shopify and Printful accounts and connects them. Payouts, tax IDs and bank details are the owner's to enter.
4. Add the products, copy and mock-ups, then place a test order to check print quality.
5. Put the link in bio and post a "Hoot merch" Short following SCRIPT_RULES.md.

## Open decisions for the owner
1. Which products to launch with: all four, or just the tee and mug.
2. Whether to sell personalised designs ("[Name] Explains") or plain Hoot designs.
3. The prices.
4. The store name and web address.
