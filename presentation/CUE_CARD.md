# Lawris — 5-min Pitch Cue Card

> **Print A4 landscape. Carry into the room. Glance at it between slides — never read from it.**

---

## ⏱ Time budget

| Beat | Slot |
|---|---|
| Cold open | 0:00 → 0:30 |
| Problem stats | 0:30 → 1:00 |
| What we built | 1:00 → 1:15 |
| **LIVE DEMO** | **1:15 → 3:30** |
| Why us | 3:30 → 4:15 |
| Roadmap + ask | 4:15 → 4:45 |
| Q&A buffer | 4:45 → 5:00 |

Hard cap: **5:00**. Soft target: **4:45**.

---

## 🎤 Cold open (memorise verbatim — first 30s sets the tone)

> "An accused person in India has 90 days. If their lawyer misses the chargesheet deadline by even a day, they walk free.
>
> Lawyers in this country handle 50 to 200 active cases each — on physical files, WhatsApp, and three different research portals. Calendaring failures are responsible for one in four malpractice claims.
>
> We built an AI agent that makes those misses impossible."

---

## 💻 Demo script — exact clicks (target 2:15)

| Clock | Action | One-liner |
|---|---|---|
| 0:00 | Land on **dashboard** | "Three matters. **One critical** — chargesheet on a POCSO case is due in 2 days. The system computed that from the FIR date and BNSS section 187(3). If she misses it, the accused walks." |
| 0:25 | Click **POCSO case** | "Real FIR, real sections, real client." |
| 0:35 | Documents → **Draft Bail Application** | "I'm asking the AI to draft this — *for this specific case*." |
| 0:45 | (streaming begins) | **STAY QUIET. Let them watch.** |
| 1:05 | (draft complete) | "Court-ready. Cites *Satender Kumar Antil*, Article 21, the FIR number, my client's name — all from the database. Even noticed the chargesheet was overdue and added that as a ground. **No lawyer typed any of this.** Twenty-five seconds." |
| 1:25 | Hearings → **Add Hearing** (type briefly) | "Just came back from court. Logging it in 15 seconds." |
| 1:50 | Save → header **AI summary** updates | "Anyone on the team can now read 30 seconds and know exactly where this case stands. Today, that lives in one lawyer's head." |
| 2:00 | Research → ask **"what is default bail under section 187(3) BNSS?"** | "And research — case-aware. Two cited Supreme Court cases, the relevant statute. Not a Wikipedia answer." |
| 2:15 | END → next slide | (transition) |

**Demo broke?** Within 5 seconds: "Here's the recording from this morning." Play backup video. Recover at slide 5.

---

## 🥊 Differentiator one-liner

> "Clio is great in America but doesn't know Indian law. Harvey is brilliant at drafting but doesn't know Indian law either. MyKase manages cases in India but has no AI. We're the first product where all four columns are checked. **That's a defensible position, not a feature.**"

---

## 🎯 Closing line (memorise)

> "We have a working product, a clear wedge, and a market that wants this badly. We're looking for honest feedback on what would make this indispensable to a working lawyer. Thank you."

❌ Don't end with "Questions?" — judges ask without prompting.

---

## 🛡 Q&A — 1-line answers

| Q | A |
|---|---|
| **vs Harvey AI?** | "Harvey is a brilliant general-purpose drafter trained on US/UK law. We're Indian-first — BNSS sections, POCSO thresholds, Order VII pleading format. Harvey would draft a bail application in the wrong language." |
| **Hallucinated citations?** | "Right now we constrain prompts to well-known precedents and label outputs as drafts. Next iteration grounds research in IndianKanoon's API so every citation is verifiable. v1 is advocate-assist, not advocate-replace." |
| **Won't lawyers refuse to trust AI?** | "Every output is editable before it leaves our system. We're not generating final filings — we're generating the 80% draft that takes a junior associate 90 minutes today. The senior advocate still signs." |
| **What's the moat?** | "The legal-format prompt library plus the deadline rule engine — both are weeks of legal research compressed into code. A US incumbent would have to start over for India." |
| **Why now?** | "Two reasons: free streaming LLMs at this quality only exist since 2024, and BNSS replaced CrPC in July 2024 — every existing template needs rewriting. We hit the window perfectly." |
| **How big is the market?** | "1.4M advocates in India. At 1% paying ₹500/month, that's ₹84 cr ARR. Adoption goes urban tier-1 first — Mumbai, Delhi, Bangalore." |
| **Data privacy?** | "Per-lawyer Postgres rows with row-level security post-MVP, encrypted at rest, no client data in training. Self-host on AWS Mumbai available for firms that require it." |
| **Why not a fine-tuned legal model?** | "Cost and speed. Gemini 2.5 Flash with our prompt library outperforms fine-tuned models on the structured tasks we care about, at $0 marginal cost on free tier. Fine-tuning becomes interesting only after we have proprietary case-outcome data." |

**If asked something not on this list:** answer the part you're confident about, then say "we'd love to talk after." **Never bluff.**

---

## ✅ Pre-flight checklist (run 30 min before)

- [ ] Laptop **plugged in** (no battery during demo)
- [ ] Browser **incognito** at `http://localhost:3000`, **zoom 110%**
- [ ] Tabs: localhost · slide deck · backup video. **Nothing else.**
- [ ] Notifications **off** (Slack, mail, Teams, calendar)
- [ ] **Phone hotspot on** as backup network
- [ ] Backup video **plays in 1 click** with audio
- [ ] **Run the demo cold once** to warm Gemini's response time
- [ ] **One driver, one speaker** — never the same person
- [ ] Dashboard shows **"1 critical · 1 high"** (if not, the seed dates are stale)
- [ ] Printed bail-app handout in hand for the judges

---

## 🚫 Forbidden phrases during the pitch

- "Sorry, we didn't have time to..."
- "Just give us a second to fix this..."
- "As you can see on this slide..." (then reading it)
- "Any questions?"
- "It's basically just a wrapper around an LLM"
- "We're like X but for Indian lawyers" (be Lawris, not "the X for Y")

---

**Pitch lives or dies in the demo. Practice it 4 times before walking in.**
