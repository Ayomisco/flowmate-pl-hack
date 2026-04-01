# FlowMate Demo Script — Screen Recording

**Duration:** ~4–5 minutes
**Setup:** Open browser to your deployed app (flowmate-two.vercel.app). Clear browser cache/history for a clean demo. Have a second tab ready if needed.

---

## INTRO — Login Screen (0:00 – 0:30)

> "Hey — I'm going to walk you through FlowMate, an autonomous financial operating system built on the Flow blockchain."
>
> "The idea is simple: you tell FlowMate what you want to do with your money — save, send, stake, invest — and the AI agent handles everything. No buttons to hunt for, no forms to fill. Just say what you need."
>
> "Let's jump in."

**[ACTION]** You're on the login screen. Point out:
- The tagline: *"Autonomous Financial Agent"*
- The status badge: *"Network Active · Flow Testnet"*

> "We use Magic Link for authentication — no passwords, no seed phrases. You enter your email, get a one-time code, and you're in."

**[ACTION]** Click **Sign In with Email**, type your email, submit. Wait for the Magic link flow to complete and redirect to Dashboard.

---

## DASHBOARD (0:30 – 1:30)

> "This is the dashboard — your financial command center."

**[ACTION]** Slowly scroll down the Dashboard, pointing out each section:

**Total Wealth card:**
> "At the top, you see your total wealth across all vaults, plus your Flow wallet address."

**Quick Actions (Send, Receive, Save, Swap):**
> "These four quick actions let you send FLOW to anyone, receive, save into different vaults, or swap between them."

**[ACTION]** Tap **Save** briefly to show the Save modal — enter an amount, select "savings" vault, then cancel (or execute if you want).

**Wealth Vaults:**
> "FlowMate organizes your money into four vaults — Available for spending, Savings, Emergency fund, and Staking which earns 8.5% APY. This isn't just UI — every vault is tracked on-chain through our custodial smart contract on Flow."

**Active Automations:**
> "Here you can see your active automations — rules you've set up that run automatically. We'll look at those in a second."

**Goals Preview:**
> "And your savings goals with progress tracking."

**Recent Activity:**
> "Every transaction is logged with a direct link to Flowscan, the Flow blockchain explorer. Nothing is hidden."

---

## AI AGENT CHAT — The Core Experience (1:30 – 3:00)

> "Now here's where FlowMate gets interesting. Let me show you the AI agent."

**[ACTION]** Tap **Agent** in the bottom nav to go to `/chat`.

> "This is a conversational interface powered by an LLM. You don't navigate menus — you just talk to it."

**[ACTION]** Type: **"hey, what's up?"** and send.

> "Notice it's not just a command parser — it actually has a personality. It can chat, give advice, and only suggests financial actions when you ask for them."

**[ACTION]** Wait for the streaming response. Point out the word-by-word typing effect.

> "Responses stream in real-time, token by token."

**[ACTION]** Type: **"Save 50 FLOW to my savings vault"** and send.

> "Now I'm asking it to save 50 FLOW. Watch — it understands the intent, extracts the amount and destination vault..."

**[ACTION]** Point out the **"Action Ready"** card that appears with the execution payload (amount: 50, toVault: savings).

> "It shows me exactly what it's about to do and asks for confirmation. This is a security feature — no transaction executes without you pressing this button. Even if you're in autopilot mode."

**[ACTION]** Click **Execute Now**.

> "Done. The balance updates instantly — vault-to-vault transfers are confirmed immediately. And there's the confirmation."

**[ACTION]** Type: **"How about we send 5 FLOW to 0xc26f3fa2883a46db"**

> "Now let's do an actual on-chain transfer. I'm sending 5 FLOW to a real address on Flow testnet."

**[ACTION]** When the Action Ready card appears, click **Execute Now**. Point to the Flowscan link.

> "That transaction just went through the Flow blockchain. You can verify it right here on Flowscan."

---

## AUTOMATIONS (3:00 – 3:45)

**[ACTION]** Tap **Automate** in the bottom nav.

> "Automations are where FlowMate becomes truly autonomous. You can set recurring rules — auto-save every Friday, send rent payments monthly, dollar-cost-average into staking."

**[ACTION]** Tap to create a new rule:
- Select **Auto-Save**
- Amount: **25**
- Save to: **Savings**
- Frequency: **Weekly**
- Day: **Friday**
- Time: **09:00**
- Hit **Create Rule**

> "I just set up a rule to auto-save 25 FLOW every Friday at 9 AM. The system handles it — I don't have to remember."

**[ACTION]** Show the rule card with status "Active" and next execution date.

> "You can pause, resume, or delete rules anytime."

---

## GOALS (3:45 – 4:15)

**[ACTION]** Navigate to Goals (from Dashboard or type /goals).

> "Goals give you something to save toward. Let me create one."

**[ACTION]** Create a goal:
- Name: **"New MacBook"**
- Target: **2000**
- Deadline: pick a date ~3 months out
- Hit Create

> "FlowMate tracks your progress. You can contribute directly from your available vault —"

**[ACTION]** Click the goal, contribute **100 FLOW**.

> "— and the progress bar updates in real-time."

---

## CONFIG — Autonomy Modes (4:15 – 4:30)

**[ACTION]** Tap **Config** in the bottom nav.

> "One last thing — the autonomy modes. You control how much freedom the AI agent has."

**[ACTION]** Point to the three options:

> "Manual means you approve everything. Assisted means FlowMate suggests and you confirm. And Autonomous means it operates on its own within your daily limits. You decide how much you trust the agent."

---

## CLOSING (4:30 – 4:50)

> "So that's FlowMate — an AI-powered financial OS on Flow. You talk to it like a friend, it manages your money like a professional. Every transaction is on-chain, every action is transparent, and you're always in control."
>
> "Built with React, Express, Prisma, Groq AI, and Cadence smart contracts on Flow testnet."
>
> "Thanks for watching."

---

## PRO TIPS FOR RECORDING

1. **Use a clean account** — fresh login looks better than one with messy test data
2. **Browser zoom 110-125%** — makes UI elements more readable on video
3. **Hide bookmarks bar** — cleaner look
4. **Use a mic** — even earbuds sound better than laptop mic
5. **Record at 1080p minimum**
6. **Move your mouse slowly** — viewers need to follow your cursor
7. **Pause 1-2 seconds** after each action before speaking — let the UI update breathe
8. **If something fails** — don't panic, just say "let me try that again" and redo
