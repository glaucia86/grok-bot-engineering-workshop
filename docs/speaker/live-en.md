# Live presenter script — English

**Build Your First Engineering Bot with Grok Bot · Packt · November 17, 2026 · 90 minutes · 11:00–12:30 BRT / 09:00–10:30 ET**

**This is your on-stage guide.** Ten chapters, one story, and natural English to speak. Keep it in a private window. The [technical walkthrough](https://github.com/glaucia86/grok-bot-engineering-workshop/blob/main/docs/speaker/tutorial-en.md) is an appendix for exact bot prompts, commands, approved access and troubleshooting—not a second script to read aloud.

**How to use:** Read text marked **Say** aloud, and **Ask** only when there is time. **Show** and text in square brackets are stage directions; do not say them aloud. Do not read commands, skill instructions or entire bot prompts to the audience.

| Time (BRT) | Part | Focus |
| --- | --- | --- |
| 11:00–11:05 | 1 | What is Grok Bot? |
| 11:05–11:12 | 2 | Why is it different? |
| 11:12–11:16 | 3 | The future of agentic engineering |
| 11:16–11:22 | 4 | What we are building |
| 11:22–11:38 | 5 | Create FDE, QA and DevOps |
| 11:38–11:45 | 6 | pstack and skills |
| 11:45–12:14 | 7 | One continuous implementation flow |
| 12:14–12:21 | 8 | Demonstrate and verify |
| 12:21–12:25 | 9 | Final thoughts |
| 12:25–12:30 | 10 | Conclusion and questions |

**Before the audience arrives (outside the 90 minutes):** Have the Grok Bot desktop app signed in, the authorized exercise repository and approved base SHA verified, an exercise-only PR target prepared, and a tested demo preview or clearly labeled fallback. Keep the canonical reference `main` separate from the exercise. Pre-check skill availability, necessary permissions and isolated test data. Have the technical guide nearby for full instructions and failure recovery. Do not show real credentials, force-push, change repository visibility or run destructive database commands.

## 1. What is Grok Bot? — 5 min

**Show:** The Grok Bot home screen, not a terminal or a long configuration file.

> **Say:** “Hi everyone! I’m Glaucia, and welcome. Today we’re going to build a small engineering team with AI bots. My goal is simple: I want you to see how bots can work together, not just how an AI model can write code.”

> **Say:** “Think of Grok Bot as a place where you can create AI teammates. Each one has a role and a conversation, and the bots can use tools and work on a shared cloud computer. They can help with work that takes more than one message.”

> **Ask:** “Have you already tried an AI coding agent? Just a yes or no in the chat is perfect.” [Acknowledge one or two answers; continue even if the chat is quiet.]

**Transition:** “So how is this different from asking a coding assistant to implement a feature?”

## 2. Why use Grok Bot? — 7 min

**Show:** The Bots list and, if available, the shared computer view. Do not expose sign-ins or secrets.

> **Say:** “A coding agent is great at a focused implementation task. Grok Bot gives us another layer: we can define long-lived roles, give bots different responsibilities, and let them hand work to each other.”

> **Say:** “The interesting part is the shared computer. Project files and working context can stay there, so the next bot can continue from a real artifact rather than from a vague summary. But sharing a computer also means we need clear permissions and good boundaries.”

> **Say:** “I don’t need one giant bot that does everything. I’d rather have a builder, an independent reviewer, and someone who helps us read delivery status.”

**Transition:** “That small team also gives us a glimpse of where software engineering is going.”

## 3. The future of agentic engineering — 4 min

**Show:** Your three-role illustration or existing team slide. Do not claim an external fleet case study is part of this live demo.

> **Say:** “We are moving from giving agents isolated coding tasks toward coordinating a team of specialists. A human defines the goal, sets the boundaries, and reviews the evidence.”

> **Say:** “Some engineering teams already describe much larger fleets of agents. That’s inspiring, but we don’t need dozens of agents to learn the pattern. Today, three bots are enough.”

> **Say:** “The point is not to remove engineering judgment. It is to spend more of our time on design, integration, quality, and decisions.”

**Transition:** “Let’s make that concrete with one small application.”

## 4. What are we building? — 6 min

**Show:** The prepared feedback app or the existing repository's exercise base. Explain the reference and starter as different artifacts.

> **Say:** “We’re building a simple feedback experience for talks and workshops. A participant can pick a rating from one to five, leave an optional comment, and submit feedback. Then we can open a results page and see how each talk is doing.”

> **Say:** “We already have an API and a prepared project. We are not going to create an entire platform, database, and deployment pipeline from zero today. Our task is to complete the user experience and verify that it behaves correctly.”

**Ask:** “What is one thing you would test before calling this feature complete?” [Take one brief answer. If time is short, offer form validation as the example.]

**Transition:** “To deliver that small feature, we’ll create three teammates.”

## 5. Live demo: create FDE, QA and DevOps — 16 min

**Show:** In Grok Bot, use **New → Create new Bot** for each personal Bot; use its profile controls for the name and durable role. User interface labels can vary; use the controls actually visible. These are three collaborating Bots, **not** the separate Team Bot product.

**Bot 1 — FDE (builder):**

> **Say:** “First is our FDE, our builder. It owns the feedback form and results UI. It should propose a small design before it starts changing code, and it should work on the authorized exercise branch.”

**Role to configure:** “Build the approved feedback UI from the existing API. Propose the files and tests first. Work only in the authorized exercise repository and branch. Never merge. Return a PR and verifiable evidence.”

**Bot 2 — QA (independent reviewer):**

> **Say:** “Next is QA. QA should not simply trust that the builder says the feature works. It checks the user journey and brings back evidence.”

**Role to configure:** “Independently evaluate the approved acceptance criteria. Check valid and invalid inputs, results and empty states. Show evidence linked to the tested commit. Do not modify product code or merge.”

**Bot 3 — DevOps (checks and preview):**

> **Say:** “And our third bot is DevOps. It helps us understand whether the checks passed and whether the preview is available. It reports the facts, but it does not deploy, change permissions or merge without approval.”

**Role to configure:** “Report CI status, the reviewed commit and verified preview links. Separate PASS, FAIL and BLOCKED. Do not expose secrets, change access or merge.”

**Show:** If time allows, create a group chat from **New** and select the three Bots. The group is for short visible handoffs; keep sensitive approval or login steps in the proper one-to-one flow. Do not wait for lengthy bot replies during this setup block.

> **Say:** “We now have three different responsibilities: build, test, and delivery evidence. I will still make the final engineering decision.”

**Transition:** “Before we give them work, we need to explain one idea that makes their output more reliable.”

## 6. pstack and reusable skills — 7 min

**Show:** One relevant skill from the repository's approved skills, then the `principle-prove-it-works` instructions. Do not install a large new toolchain during the presentation.

> **Say:** “A skill is a reusable set of instructions. Instead of repeating a long explanation in every task, we give the bot a clear method for a specific kind of work.”

> **Say:** “For this project, we also use skills adapted from pstack, associated with Lauren Tan. One rule is especially important: `principle-prove-it-works`. It means the bot must check the real result before it says the work is done.”

> **Say:** “A successful build is useful. But a successful build is not proof that the form actually saves feedback or that the results page shows it. We need to verify the behavior.”

**Show:** The approved skill configuration in the technical guide. QA's four-skill set is an explicit project exception; do not silently remove `interrogate` to simplify this talk. `principle-prove-it-works` is the common completion principle, separate from the bot-specific skill count.

**Transition:** “Now let’s use that rule in one real development flow.”

## 7. Demo: one implementation flow — 29 min

**Show:** The exercise task and Bots. One feature, one exercise PR, one review. Use the exact prepared prompts from the technical walkthrough rather than inventing live repository IDs.

**Part A — Request a design.**

> **Say:** “I’ll start with the FDE. First I want a plan: which files will change, how the UI connects to the API, and how the feature will be tested. We review the plan before we approve implementation.”

[Use the pre-reviewed design prompt. Approve only the specific scope after checking its contracts and tests. Do not present a proposed design as approved until you decide.]

**Part B — Build and hand off.**

> **Say:** “With that scope approved, our FDE can build. I want a pull request with the actual changed files, tests, and a short handoff. The next bot should be able to read the work without guessing what happened.”

[Use a short written handoff or the real PR description to point to the artifact, exact commit, tests and unresolved items. You do **not** need to build the four-bot task board or introduce InsForge.]

**Part C — Verify independently.**

> **Say:** “QA now checks the result independently. DevOps checks the matching CI and preview status. Notice that they have different jobs, but they are looking at evidence for the same change.”

[Run only checks supported by the prepared environment. Remote test-data writes require the approved isolated target and permissions. Keep any missing evidence labeled BLOCKED.]

**Part D — Review together.**

> **Ask:** “Would you merge this PR just because an agent says ‘done’?” [Pause briefly.]

> **Say:** “I want to see the change, the independent test results and the CI status for the same commit. If something is missing, we leave it open and say what needs to be checked.”

**If a bot is still working:** “While we wait, let’s look at what the next reviewer will need to verify.” [Use the prepared example, clearly label it, and never claim it is a live output.]

**If a step fails:** “This part is blocked. I’ll show what we were able to verify, and I won’t call the rest a success.”

**Transition:** “Let’s look at the feature from a user’s point of view.”

## 8. Conclude the demo: show the result — 7 min

**Show:** Only a verified preview or a clearly identified reference app. If authorized, submit **one synthetic** feedback entry, inspect its response, open results, and reload. Do not repeatedly send writes when the response is uncertain.

> **Say:** “Here is the feedback form. I can choose a talk, give it a rating, and leave the comment blank because it is optional.”

> **Say:** “Now we check what actually happened. Did the request succeed? Did the results change? And what happens when I reload the page?”

[If you do not have a verified live preview, say: “This is the prepared reference application, not proof that our live PR is complete.”]

> **Say:** “The important result is not just a screen that looks finished. It’s a feature we can inspect and verify.”

**Transition:** “Before we finish, I want to leave you with one engineering lesson.”

## 9. Final thoughts — 4 min

**Show:** The three roles again, with a short phrase: **Clear roles → Useful handoffs → Real evidence → Human decision**.

> **Say:** “Today, we created a small engineering team: one bot to build, one to test, and one to inspect delivery status. We gave them clear responsibilities, shared context, and a rule for verifying their work.”

> **Say:** “For me, agentic engineering is not about writing more code with less attention. It is about designing a better engineering process where automation and human judgment work together.”

**Transition:** “Let’s wrap up with the main takeaway, and then I’d love to hear your questions.”

## 10. Conclusion and questions — 5 min

> **Say:** “If you remember only three things, remember these: give each bot one clear job, make handoffs easy to inspect, and ask for real evidence before you trust a result.”

> **Say:** “We kept the example deliberately small. You can take the same pattern to larger engineering problems, but start with a task you know how to verify.”

> **Ask:** “What would you like to explore next: bot roles, skills, or the review process?” [Take the available questions. If unsure, say: “I want to check that before I give you an answer.”]

> **Close:** “Thank you so much for joining me today. I hope this gives you a practical starting point for building your own engineering team with Grok Bot. Enjoy the rest of your day!”

**Presenter's note:** If a live step takes longer than planned, cut optional audience questions or extended explanation, **not** verification or the human approval boundary. Preserve the final five minutes for closing and questions.

**References (for preparation, not an extra live segment):** [Official Grok Bot getting started](https://docs.x.ai/grok-bot/get-started) · [Create and manage Bots](https://docs.x.ai/grok-bot/bots) · [Message and collaborate](https://docs.x.ai/grok-bot/chat-and-collaboration) · [Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations) · [Grok Bot for Engineering](https://x.ai/bot/guides/grok-bot-for-engineering) · [Akshay Pachaar's engineering-team example](https://x.com/akshay_pachaar/article/2092664985197723937) · [Lingxi Li's engineering fleet](https://x.com/lingxi/article/2094493172516966781).
