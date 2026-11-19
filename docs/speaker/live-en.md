# Live presenter script — English

**Build Your First Engineering Bot with Grok Bot · Packt · November 20, 2026 · 90 minutes · 11:00–12:30 BRT / 09:00–10:30 ET**

**This is your on-stage guide.** Eight blocks, the same order and times as the slides and their time bar, with natural English to speak. Keep it in a private window. The [English technical appendix](../en-us/) is an appendix for exact bot prompts, commands, approved access and troubleshooting—not a second script to read aloud.

**How to use:** Read text marked **Say** aloud, and **Ask** only when there is time. **Show** and text in square brackets are stage directions; do not say them aloud. Do not read commands, skill instructions or entire bot prompts to the audience. Each block names its slides: when the slide number changes, move to the next part of the block.

| Time (BRT) | Time (ET) | Block | Slides | Focus |
| --- | --- | --- | --- | --- |
| 11:00–11:05 | 09:00–09:05 | 0 · Setup | 1–5 | Welcome, what we build, the one rule |
| 11:05–11:12 | 09:05–09:12 | 1 · Create bots | 6–8 | Create FDE, QA and DevOps |
| 11:12–11:20 | 09:12–09:20 | 2 · Design | 9 | Ask the FDE for a design |
| 11:20–11:40 | 09:20–09:40 | 3 · Verify | 10–14 | Build, prove it works, QA plans checks |
| 11:40–11:55 | 09:40–09:55 | 4 · Background PR | 15–16 | CI and preview status, send one feedback |
| 11:55–12:10 | 09:55–10:10 | 5 · Approval | 17–18 | Read three things, then decide |
| 12:10–12:22 | 10:10–10:22 | 6 · Recovery | 19 | Recovery first, say what is BLOCKED |
| 12:22–12:30 | 10:22–10:30 | 7 · Recap and Q&A | 20–23 | Three takeaways, questions, close |

**Before the audience arrives (outside the 90 minutes):** Have the Grok Bot desktop app signed in, the authorized exercise repository and approved base SHA verified, an exercise-only PR target prepared, and a tested demo preview or clearly labeled fallback. Keep the canonical reference `main` separate from the exercise. Pre-check skill availability, necessary permissions and isolated test data. Have the technical guide nearby for full instructions and failure recovery. Do not show real credentials, force-push, change repository visibility or run destructive database commands.

## 0. Setup — 11:00–11:05 BRT · slides 1–5

**Show (slide 1):** The title slide in fullscreen. Keep this script and the speaker notes on your private screen.

> **Say:** “Hi everyone! I’m Glaucia, and welcome. Today we’re going to build a small engineering team with AI bots. My goal is simple: I want you to see how bots can work together, not just how an AI model can write code.”

> **Ask:** “Have you already tried an AI coding agent? Just a yes or no in the chat is perfect.” [Do not wait. Acknowledge one answer later if it arrives.]

**Show (slide 2):** The eight-step plan.

> **Say:** “Think of Grok Bot as a place where you can create AI teammates. Each one has a role and a conversation, and they can use tools on a shared cloud computer. We start with an empty chat, and we end with a reviewed pull request.”

**Show (slides 3–4):** The repository and the architecture. Explain the reference and starter as different artifacts.

> **Say:** “We’re building a simple feedback experience for talks. A participant picks a rating from one to five, leaves an optional comment, and submits. Then a results page shows how each talk is doing.”

> **Say:** “The API and the database are already prepared. We are not building a platform from zero today. Our task is to complete the user experience and verify that it behaves correctly.”

**Show (slide 5):** The one rule. Pause before you speak.

> **Say:** “One rule for today: the bot that builds does not judge its own work. And no bot merges. I do.”

**Transition:** “So let’s create the team.”

## 1. Create FDE, QA and DevOps — 11:05–11:12 BRT · slides 6–8

**Show (slides 6–7):** The team flow and the charters. Click quickly; one sentence per click.

> **Say:** “I don’t need one giant bot that does everything. I’d rather have a builder, an independent reviewer, and someone who helps us read delivery status. Each one owns something, knows what good output looks like, and knows where to stop.”

**Show (slide 8, then Grok Bot):** Use **New → Create new Bot** for each personal Bot; use its profile controls for the name and durable role. User interface labels can vary; use the controls actually visible. These are three collaborating Bots, **not** the separate Team Bot product.

**Bot 1 — FDE (builder):**

> **Say:** “First is our FDE, our builder. It owns the feedback form and results UI. It proposes a small design before it changes code, and it works on the authorized exercise branch.”

**Bot 2 — QA (independent reviewer):**

> **Say:** “Next is QA. QA does not simply trust that the builder says the feature works. It checks the user journey and brings back evidence.”

**Bot 3 — DevOps (checks and preview):**

> **Say:** “And our third bot is DevOps. It tells us whether the checks passed and whether the preview is available. It reports the facts, but it does not deploy, change permissions or merge without approval.”

**Mandatory private configuration:** Open the [bundled English technical appendix](../en-us/) and follow **Step 09 (FDE), Step 10 (QA), and Step 11 (DevOps)**. Paste the **complete durable instructions** for each bot, select the **approved skills** (including QA's four-skill exception) and common `principle-prove-it-works` completion rule, then confirm the settings were saved. The spoken lines above are **explanations, never Bot prompts**. Keep every repository/ref/SHA guard, authorization and isolated-preview gate, no-force-push and no-production-write boundary, BLOCKED handling, and human-only merge requirement. Pre-stage the full instructions before the workshop; never replace them with summaries. If any prerequisite cannot be confirmed, stop that operation and report BLOCKED.

**If late:** Do not create DevOps live; show its prepared instructions instead.

**Show:** If time allows, create a group chat from **New** and select the three Bots. The group is for short visible handoffs; keep sensitive approval or login steps in the proper one-to-one flow. Do not wait for lengthy bot replies during this setup block.

> **Say:** “We now have three different responsibilities: build, test, and delivery evidence. I will still make the final engineering decision.”

**Transition:** “Now let’s give the builder its first task. Not code yet: a plan.”

## 2. Design — 11:12–11:20 BRT · slide 9

**Show:** A new chat with the FDE. Paste the pre-reviewed design prompt from the technical appendix (Step 12). Do not invent live repository IDs.

> **Say:** “I’ll start with the FDE. First I want a plan: which files will change, how the UI connects to the API, and how the feature will be tested. We review the plan before we approve implementation.”

**If the bot is still working:** “Let’s give it a few seconds. While the bot works, let me explain what I’m looking for.” [Point to the three checks on slide 9: decisions, files, tests.]

[When the design arrives, show only decisions, files to change, tests and the separate list of assumptions. If something is open, decide it in one sentence in the chat. Do not present a proposed design as approved until you decide.]

**Transition:** “The plan looks right, so let’s approve it.”

## 3. Verify — 11:20–11:40 BRT · slides 10–14

**Show (slide 10, then Grok Bot):** Paste the explicit design approval (Step 13). Return to the deck while the FDE works.

> **Say:** “With that scope approved, our FDE can build. I want a pull request with the actual changed files, tests, and a short handoff. The next bot should be able to read the work without guessing what happened.”

> **Say:** “And remember: green CI is not acceptance. QA checks the rules we agreed on.”

**Show (slide 11):** The loop: build, pull request, verify, approve.

> **Ask (while the FDE works):** “What is one thing you would test before calling this feature complete?” [Take one brief answer. If the chat is quiet, offer form validation as the example.]

**Show (slide 12):** Prove it works.

> **Say:** “A skill is a reusable set of instructions. These bots use skills adapted from pstack, by Lauren Tan. One rule is especially important: `principle-prove-it-works`. The bot must check the real result before it says the work is done.”

> **Say:** “A successful build is useful. But a successful build is not proof that the form actually saves feedback or that the results page shows it. We need to verify the behavior.”

[QA's four-skill set is an explicit project exception; do not silently remove `interrogate` to simplify this talk. `principle-prove-it-works` is the common completion principle, separate from the bot-specific skill count.]

**Show (slide 13):** The poteto pyramid.

> **Say:** “Before the QA checklist, here is how I trust an agent more. The pyramid is ordered by cost. Cheap deterministic layers come first: the codebase, then static analysis. Verification is next, prose rules after that, and human review last, because it is the most expensive.”

**Show (slide 14, then Grok Bot):** Paste the QA preparation prompt (Step 14). QA plans checks from the criteria, not from the author's PR description.

> **Say:** “QA now prepares its checks independently. It does not read the builder’s summary as the source of truth. It reads our acceptance criteria.”

[Show two or three planned checks and any missing prerequisites. Do not present the plan as a completed evaluation. Read the FDE handoff and open the PR when it is ready (Step 15).]

**If a step fails:** “This part is blocked. I’ll show what we were able to verify, and I won’t call the rest a success.”

**Transition:** “While that runs, let’s check delivery status.”

## 4. Background PR and live feedback — 11:40–11:55 BRT · slides 15–16

**Show (slide 15, then Grok Bot / GitHub):** Ask DevOps for CI and preview status (Step 16). Secrets are checked by presence only; never shown.

> **Say:** “This runs in the cloud, not on my laptop. DevOps checks the matching CI and preview status. QA and DevOps have different jobs, but they look at evidence for the same commit.”

[If a secret value ever appears on screen: stop sharing, pause the demo, and have an authorized operator revoke or rotate it before resuming. Run QA only after its gate (Step 17). Remote test-data writes require the approved isolated target and permissions. Keep any missing evidence labeled BLOCKED.]

**Show (slide 16, then the preview):** Only a verified preview or clearly identified reference app. **First, QA must complete and document the AC8 empty-state check on the authorized, isolated QA target.** Only **after** that verification and separate permission for a manual write, submit **one synthetic** feedback entry, inspect its response, open results, and reload (Steps 18–19). Do not repeat a write if its response is uncertain. If AC8, isolation or authorization is missing, **do not submit feedback**. Report BLOCKED and, if useful, show a clearly labeled reference app in read-only mode.

> **Say:** “Here is the feedback form. I can choose a talk, give it a rating, and leave the comment blank because it is optional.”

> **Say:** “Now we check what actually happened. Did the request succeed? Did the results change? And what happens when I reload the page?”

[If you do not have a verified live preview, say: “This is the prepared reference application, not proof that our live PR is complete.”]

> **Say:** “The important result is not just a screen that looks finished. It’s a feature we can inspect and verify.”

**Transition:** “The bots brought the evidence. Now it’s my turn.”

## 5. Approval — 11:55–12:10 BRT · slides 17–18

**Show (slide 17):** Within the approved scope versus a human decides.

> **Ask:** “Would you merge this PR just because an agent says ‘done’?” [Pause briefly.]

> **Say:** “Inside the approved scope, the bots can work alone. But merging, deploying or deleting waits for a human. I always merge.”

**Show (slide 18, then GitHub):** First confirm the target: the approved exercise repository and branch, never the reference `main` and never the frozen checkpoint. Then read the PR in this order: what changed, the QA report, the CI status (Steps 20–22).

> **Say:** “I want to see the change, the independent test results and the CI status for the same commit. If something is missing, we leave it open and say what needs to be checked.”

> **Say:** “Human approval is not distrust of the agent. It is the most expensive layer, so it comes last, after the other layers have filtered what they could.”

[Merge personally only if every required criterion is PASS and any WARN was assessed. With FAIL, send the focused fix prompt (Step 21) or show the FAIL as an example if late. With BLOCKED, do not present the MVP as accepted. If the target is unclear, say: “I will confirm the target first.” and do not merge.]

**Transition:** “Let’s use the last minutes for what matters most: finishing the core.”

## 6. Recovery first — 12:10–12:22 BRT · slide 19

**Show:** At **12:10 BRT**, stop adding features. **Reserve 12:10–12:22 BRT for recovery first:** incomplete QA, CI evidence, preview checks, or human review take priority (Step 23). Record each unresolved blocker and owner. If the core is already verified, you may briefly discuss optional ideas, but do not turn on a routine or make unapproved writes. **Stop recovery at 12:22**, even if some work remains.

> **If checks or review are pending:** “We’re using this time to finish the essential checks and review. If something is still blocked, I’ll show what we verified, who owns the next action, and what proof is still missing.”

> **If the core is complete:** “Today, we created a small engineering team: one bot to build, one to test, and one to inspect delivery status. We gave them clear responsibilities, shared context, and a rule for verifying their work.”

> **If time remains:** “For me, agentic engineering is not about writing more code with less attention. It is about designing a better engineering process where automation and human judgment work together.”

**Transition at 12:22 BRT:** “Let’s wrap up with the main takeaway, and then I’d love to hear your questions.”

## 7. Recap, questions and close — 12:22–12:30 BRT · slides 20–23

**Show (slide 20):** Three things to remember. State the real demo outcome, blockers, owners and next steps aloud. Never skip the recap.

> **Say:** “If you remember only three things, remember these: give each bot one clear job, ask for real evidence before you trust a result, and keep a human at every key decision.”

> **Say:** “If your inner loop produces slop, automating it just produces more slop. That line is from Lauren Tan’s talk, All Code Is Slop (Except Mine).”

**Show (slides 21–22):** Optional. Skip both if late and go straight to questions.

> **Say:** “We kept the example deliberately small. You can take the same pattern to larger engineering problems, but start with a task you know how to verify.”

**Show (slide 23):** Questions. Open questions at **12:26 BRT**.

> **Ask:** “What would you like to explore next: bot roles, skills, or the review process?” [Take the available questions. If unsure, say: “I want to check that before I give you an answer.”]

> **Close (by 12:29):** “Thank you so much for joining me today. I hope this gives you a practical starting point for building your own engineering team with Grok Bot. Enjoy the rest of your day!”

**Presenter's note:** If a step runs long, shorten explanations and optional interactions, **not** verification or human approval. Protect 12:10–12:22 BRT for recovery first, recap from 12:22, questions from 12:26, and close by 12:30.

**References (for preparation, not an extra live segment):** [Official Grok Bot getting started](https://docs.x.ai/grok-bot/get-started) · [Create and manage Bots](https://docs.x.ai/grok-bot/bots) · [Message and collaborate](https://docs.x.ai/grok-bot/chat-and-collaboration) · [Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations) · [Grok Bot for Engineering](https://x.ai/bot/guides/grok-bot-for-engineering) · [Akshay Pachaar's engineering-team example](https://x.com/akshay_pachaar/article/2092664985197723937) · [Lingxi Li's engineering fleet](https://x.com/lingxi/article/2094493172516966781).
