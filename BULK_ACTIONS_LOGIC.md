# Bulk Actions — Interaction Logic Specification

This document describes the bulk actions interaction model validated in the bulk payment prototype. **Model 3** is the reference implementation for **Change payment method**. Use this spec when adding bulk actions to another table-based prototype.

---

## Overview

The interface is a **table of payments** with row selection via checkboxes. When one or more rows are selected, a **persistent action bar** slides up from the bottom of the screen. The action bar is a live summary of the current selection — it updates immediately whenever selection or row state changes.

**Core principle:** Selection is global, but **eligibility and grouping are specific to each action**. The same selection may produce different eligible subsets depending on which action the user chooses.

**Second core principle:** Bulk actions **modify selected rows but do not clear selection** (except Delete, which removes the rows entirely). After any action, the user can continue working through the same selection.

---

## Table and Selection

### Table structure

The table lists payments. Each row includes a **Status** column (among other columns such as recipient, amount, payment method, due date).

Rows are selectable. Selection is independent of status — any row can be selected regardless of its status.

### Checkbox selection

Each row has a **checkbox** in the first column.

The user can:
- Select a single row (checkbox or click row)
- Select multiple rows
- Select all rows (header checkbox; supports indeterminate state when partially selected)

### Selection → Action bar

| Condition | Behaviour |
|-----------|-----------|
| **0 rows selected** | Action bar is hidden |
| **≥ 1 row selected** | Action bar slides up from bottom and remains visible |
| Selection changes | Action bar recalculates instantly |
| Row state changes (status, method) while selected | Action bar recalculates instantly; selection stays active |

The table remains visible and usable behind the action bar.

---

## Status Column

Each payment has exactly one **status**. Status drives action eligibility.

### Status values

| Status | Meaning | Payable? | Approve eligible? |
|--------|---------|----------|-------------------|
| **Ready to pay** | Payment never required approval; can be paid immediately | Yes | No |
| **Needs approval** | Prepared by team; waiting for authorised user to approve | No | Yes |
| **Approved** | Already approved; ready to be paid | Yes | No |
| **Needs attention** | Has unresolved issues blocking payment | No | No |

### Needs attention — issue count

When status is **Needs attention**, the Status column displays an **issue count** to signal multiple things may need resolving:

```
Needs attention · 3 issues
Needs attention · 1 issue
```

- `issueCount` is a per-row property (integer ≥ 1)
- Display format: `Needs attention · {n} issue(s)`
- Other statuses use plain labels: `Ready to pay`, `Needs approval`, `Approved`

When a payment **newly** becomes Needs attention (e.g. after a payment method change), default `issueCount` to **1**.

---

## Action Bar

The action bar appears at the bottom when selection is non-empty. It has two regions: **selection summary** (left) and **actions** (right).

### Selection summary

Always shows:

```
{n} selected
```

Below that, a **status breakdown** listing only statuses present in the current selection (omit zero counts):

```
· 4 Ready to pay
· 3 Needs approval
· 2 Approved
· 3 Needs attention
```

The breakdown updates dynamically on every selection or state change.

### Actions

| Action | Label pattern | Visibility | Enabled when |
|--------|---------------|------------|--------------|
| **Pay** | `Pay {n}` | Always | `n` = count of payable rows in selection (> 0). Disabled if none payable |
| **Approve** | `Approve {n}` | Only when selection contains ≥ 1 Needs approval | Always enabled when visible |
| **Change payment method** | `Change payment method` | Always | Always enabled |
| **Delete** | `Delete` | Always | Always enabled |

**Payable count** = rows with status **Ready to pay** OR **Approved**.

**Approve count** = rows with status **Needs approval**.

### Action bar recalculation examples

**Before Approve only** (12 selected):

```
12 selected
· 4 Ready to pay
· 3 Needs approval
· 2 Approved
· 3 Needs attention

Actions: Pay 6 | Approve 3 | Change payment method | Delete
```

**After Approve only** (same 12 still selected):

```
12 selected
· 4 Ready to pay
· 5 Approved          ← was 3 Needs approval + 2 Approved
· 3 Needs attention

Actions: Pay 9 | Change payment method | Delete
```

Approve action **disappears** automatically because no selected rows still need approval. Pay count increases from 6 to 9.

---

## Pay

### Entry

User clicks **Pay {n}** on the action bar.

Only **Ready to pay** and **Approved** rows in the selection are included. All other selected rows are excluded but remain selected.

### Payment summary modal

**Title:** `Pay {n} payments`

**Content:**
- Totals grouped by currency (count + amount per currency)
- If excluded rows exist in selection, show notice:
  - How many selected payments will not be included
  - Breakdown: how many need attention, how many need approval
  - Expandable list of excluded payments (optional)

**Actions:**
| Button | Role |
|--------|------|
| Cancel | Close modal; return to table with selection intact |
| Confirm payment | Start payment |

### Processing state

On **Confirm payment**:
1. Modal switches to processing view (spinner)
2. Title/text: `Processing payment…` or `Processing {n} payments…`
3. Subtext: `This usually takes a few seconds.`
4. Modal cannot be dismissed during processing (no close, no overlay click, no Escape)
5. After ~2.5 seconds: payment completes

### On completion

- Paid rows are **removed from the table**
- Paid rows are **removed from selection** (selection shrinks; other selected rows stay selected)
- Modal closes
- Success toast: `{n} payments paid`

### Pay does NOT clear entire selection

If 12 rows selected and 6 paid, the remaining 6 stay selected and the action bar updates.

---

## Approve

### Entry

**Approve {n}** appears on the action bar only when the selection contains rows with **Needs approval**.

Clicking it opens the **Approval review** modal. Only Needs approval rows from the selection are shown (not the full selection).

### Approval review modal

**Title:** `Approve {n} payments`

**Supporting copy:**  
`These payments were prepared by your team and are waiting for your approval.`

**Content:**
- Currency totals (optional, grouped)
- List of payments: Recipient — Amount — Status (`Needs approval`)

**Actions (importance order):**

| Button | Role | Behaviour |
|--------|------|-----------|
| **Approve only** | Primary | Approve and return to table |
| **Approve and pay** | Secondary | Approve then open Pay flow for those payments |
| **Go back** | Tertiary (link) | Close modal; no changes |

Also: modal close (×) and overlay behave like Go back.

---

### Approve only

1. Close approval modal
2. Update every listed payment: **Needs approval → Approved**
3. **Keep full selection active**
4. Action bar stays open and recalculates
5. Flash/highlight approved rows briefly (~2s)
6. Toast: `{n} payments approved`

Approve action disappears if no selected rows still need approval.

---

### Approve and pay

This is a **shortcut** for approving then paying the same batch.

1. Mark all approval-list payments as **Approved**
2. Flash/highlight those rows
3. Open **Pay flow** scoped to **only those newly approved payments** (not all payable in selection)
4. Pay summary shows approval notice:

```
3 payments approved
These payments are ready to be paid. Confirm to complete approval and payment.
```

5. Primary CTA: **Confirm payment for {n}** (not generic Confirm payment)
6. Processing state runs as normal Pay flow
7. On completion: toast `{n} payments approved and paid`
8. Paid rows removed; remaining selection preserved

**Important:** Regular **Pay** from the action bar pays all payable rows in selection. **Approve and pay** pays only the batch that was just approved.

---

## Delete

### Entry

User clicks **Delete** on the action bar.

### Confirmation dialog

**Title:** `Delete {n} payments?`

**Copy:** `These payments will be permanently removed.`

**Actions:**
| Button | Behaviour |
|--------|-----------|
| Cancel | Close dialog; no changes |
| Delete payments | Confirm |

### On completion

- All selected rows removed from table
- Selection cleared (empty)
- Action bar hidden
- Toast: `{n} payments deleted`

Delete is the only bulk action that clears selection entirely.

---

## Change Payment Method (Model 3)

Model 3 is the preferred pattern: **configure all groups on one screen, show consequences inline, confirm in one step**. No separate review screen.

### Entry

User clicks **Change payment method** on the action bar.

Operates on **all selected rows**, regardless of status.

### Step 1 — Group overview modal

**Title:** `Change payment method`

**Hint:** `Configure changes for one or more groups. Consequences update as you go.`

Selected payments are **grouped by current payment method**. Each group is a card:

```
┌─────────────────────────────────────────┐
│ 3 payments                              │
│ GBP balance                    [Change] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 5 payments                              │
│ EUR balance → Debit card       [Change] │  ← after configured
│ 2 payments will need attention          │  ← inline consequence
└─────────────────────────────────────────┘
```

**Group card states:**

| State | Display |
|-------|---------|
| Unchanged | `{count} payments` + current method label |
| Configured | `{count} payments` + `{from} → {to}` + consequence line |
| Consequence (all OK) | `All payments will remain ready` (green) |
| Consequence (issues) | `{n} payments will need attention` (amber) |

Consequences evaluate **per group** as soon as a new method is chosen. User can configure one, several, or all groups before confirming.

**Footer actions:**

| Button | State | Behaviour |
|--------|-------|-------------|
| Cancel | Always | Close modal; no changes |
| Confirm all changes | Disabled until ≥ 1 group has a proposed change | Apply all configured changes |

If any configured change will cause attention issues, show footnote:  
`Affected payments can be reviewed after the changes are applied.`

---

### Step 2 — Choose how to pay (nested)

Triggered when user clicks **[Change]** on a group card.

**Title:** `Choose how to pay`

**Navigation:**
| Control | Behaviour |
|---------|-----------|
| **← Back** | Return to group overview (Step 1); preserves other groups' configured changes |
| **× Close** | Close entire Change payment method flow |

**Structure:**

Segmented tabs: **Wise** | **Other**

**Wise tab — "Current account":**
- List of balance options (e.g. GBP balance, EUR balance)
- Each row: flag, balance amount, chevron
- **Current method for this group is disabled** and labelled `Current`

**Other tab — "Other ways to pay":**
- e.g. Debit card
- Same row pattern; current method disabled

**On selecting a new method:**
- Return immediately to group overview (Step 1)
- That group shows proposed change (`GBP balance → EUR balance`)
- Consequence line appears inline
- User can configure more groups or confirm

**Cannot select the group's current method** — it is not a valid target.

---

### On Confirm all changes

1. Apply all configured method changes to affected rows
2. Update **status** per row using method-change rules (see below)
3. Rows that newly become Needs attention get `issueCount: 1`
4. **Keep selection active**
5. Close modal
6. Flash/highlight rows whose status changed (~2s)
7. Toast: `Payment methods updated`
8. Action bar recalculates

---

### Method change — status rules

When payment method changes, evaluate new status per row:

1. If change would cause issues → **Needs attention** (with issue count)
2. Else preserve workflow status:
   - Was Needs approval → stays Needs approval
   - Was Approved → stays Approved
   - Was Ready to pay → stays Ready to pay
   - Was Needs attention → stays Needs attention (keep existing issue count)

Method change never bypasses approval or attention requirements.

---

## Selection Persistence Rules

| Action | Selection after |
|--------|-----------------|
| Pay | Paid rows removed from selection; rest stays |
| Approve only | Unchanged (full selection kept) |
| Approve and pay | Paid rows removed; rest stays |
| Change payment method | Unchanged |
| Delete | Cleared (rows gone) |
| Cancel any modal | Unchanged |

Selection clears only when:
- User manually deselects rows
- User clears via select-all toggle
- Rows are deleted or paid (those specific rows leave selection)

---

## Visual Feedback

When row **status** changes (approval, method change):
- Apply a brief highlight animation on affected rows (~2 seconds)
- Subtle yellow flash (or equivalent); not dramatic

Purpose: make it obvious which rows changed without interrupting workflow.

---

## Progressive workflow example

A user selects 12 mixed payments and works through them in one session:

1. **Approve only** on 3 Needs approval → now 5 Approved; Pay shows 9
2. **Change payment method** on EUR balance group → 2 become Needs attention
3. Action bar now shows updated breakdown; Pay count may drop
4. **Pay 7** on remaining eligible rows
5. 5 rows still selected (attention + others); user deselects manually when done

The action bar reflects current state at every step.

---

## Implementation Notes for Porting

When adding this to another table prototype:

1. **Derive all action counts from `selectedRows` + current row state** — never cache stale counts
2. **Action bar is reactive** — treat it as `f(selection, rowStates)`, not a static toolbar
3. **Each action filters selection independently** — Pay, Approve, Delete, Change method each have their own eligibility rules
4. **Model 3 change method** uses two-level modal navigation: overview ↔ picker, with back arrow on picker
5. **Approve and pay** is a chained flow: approve state change → scoped pay → processing → done
6. **Status column** includes issue count for Needs attention rows
7. **Pay flow** always excludes non-payable selected rows rather than blocking the entire action

---

## Reference: Status → Action Matrix

| Status | Pay | Approve | Change method | Delete |
|--------|-----|---------|---------------|--------|
| Ready to pay | ✓ | — | ✓ | ✓ |
| Needs approval | — | ✓ | ✓ | ✓ |
| Approved | ✓ | — | ✓ | ✓ |
| Needs attention | — | — | ✓ | ✓ |

✓ = row can be affected by that action when selected  
— = row is excluded from that action's eligible subset (but remains selected)
