# Bulk Payment Actions — Prototype

An interactive prototype exploring bulk actions on a table of payments.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

## What to explore

1. **Select payments** — use checkboxes or click rows. The bottom action panel appears when anything is selected.
2. **Pay** — only ready payments are included; others are excluded with a clear summary.
3. **Delete** — simple confirmation, removes all selected rows.
4. **Change payment method** — switch between **Model 1**, **Model 2**, and **Model 3** using the prototype controls in the header.

### Model 1 — Choose a group, then change it
Sequential: pick one payment-method group → choose new method → review consequences → confirm.

### Model 2 — Configure groups, then review everything
Batch: configure changes across multiple groups → review all consequences at once → confirm.

### Model 3 — Configure and confirm in one step
Like Model 2, but consequences appear inline on each group as you configure. No separate review screen — confirm directly from the editor.

Use **Reset data** to restore the original 12 payments.

## Suggested test selections

- Select all 12 payments to see mixed eligibility across all actions
- Select only EUR balance payments (5 rows) and change to Debit card — 2 will need attention
- Select GBP balance payments (4 rows) and change to EUR balance — all remain ready
