/* Diagram specs, drawn in Excalidraw style by sketch.js + rough.js.
   `step: N` = the item appears on the Nth click (reveal.js fragment). No step = always visible. */
(function () {
  const C = { red: "#ef4444", blue: "#3b82f6", pink: "#ec4899", orange: "#f97316", amber: "#f59e0b", green: "#22c55e", teal: "#14b8a6", purple: "#8b5cf6", gray: "#94a3b8" };
  const SUB = "#a3acbd";
  const A = n => "assets/avatars/" + n + ".svg";
  function draw() {
    // 1 · MVP architecture (5 clicks)
    sketch(document.getElementById("d-arch"), { w: 1420, h: 600, seed: 3,
      nodes: [
        { id: "app", step: 1, x: 255, y: 30, w: 540, h: 230, color: C.gray, dashed: true, text: "" },
        { id: "br", step: 1, x: 0, y: 75, w: 218, h: 130, color: C.gray, text: "Browser\nform · dashboard", subColor: SUB, subSize: 25 },
        { id: "ui", step: 1, x: 285, y: 80, w: 220, h: 150, color: C.blue, fill: "rgba(59,130,246,.25)", text: "Next.js UI\nshadcn · charts", subColor: SUB, subSize: 25 },
        { id: "api", step: 2, x: 545, y: 80, w: 225, h: 150, color: C.purple, fill: "rgba(139,92,246,.25)", text: "API route\n/api/feedback\nZod schema", size: 30, subColor: SUB, subSize: 25 },
        { id: "orm", step: 3, x: 870, y: 85, w: 200, h: 120, color: C.teal, fill: "rgba(20,184,166,.22)", text: "Drizzle ORM", size: 32 },
        { id: "db", step: 3, x: 1135, y: 65, w: 270, h: 160, shape: "ellipse", color: C.green, fill: "rgba(34,197,94,.22)", text: "Neon Postgres\ntable: feedback", subColor: SUB, subSize: 25 },
        { id: "pr", step: 4, x: 30, y: 390, w: 220, h: 120, color: C.gray, text: "GitHub PR", size: 32 },
        { id: "ci", step: 4, x: 380, y: 375, w: 330, h: 150, color: C.orange, fill: "rgba(249,115,22,.2)", text: "GitHub Actions\nVitest · Playwright", subColor: SUB, subSize: 25 },
        { id: "pv", step: 5, x: 860, y: 390, w: 300, h: 120, color: C.amber, fill: "rgba(245,158,11,.2)", text: "Vercel preview", size: 32 }
      ],
      edges: [
        { step: 1, from: "br", to: "ui" }, { step: 2, from: "ui", to: "api" }, { step: 3, from: "api", to: "orm" }, { step: 3, from: "orm", to: "db", label: "SQL", size: 27 },
        { step: 4, from: "pr", to: "ci", label: "every PR", size: 27 }, { step: 5, from: "ci", to: "pv", label: "deploy", size: 27 },
        { step: 5, from: "pv", to: "app", dashed: true, label: "serves", color: C.amber, lx: 835, ly: 350, size: 27 },
        { step: 5, from: "ci", to: "pv", via: [790, 580], dashed: true, label: "e2e on the real preview", color: C.pink, labelColor: "#f9a8d4", ly: 580, lx: 560, size: 27 }
      ],
      notes: [ { step: 1, x: 270, y: 12, text: "Next.js App Router · one repo, one deploy", size: 27, color: "#cbd5e1" },
               { step: 3, x: 1410, y: 312, anchor: "end", text: "🔒 DATABASE_URL: only in Vercel + GitHub secrets", size: 25, color: "#fbbf24" } ]
    });

    // 2 · Team flow (6 clicks)
    sketch(document.getElementById("d-team"), { w: 1420, h: 700, seed: 11,
      nodes: [
        { id: "me", step: 1, x: 0, y: 200, w: 255, h: 190, avatar: A("glaucia"), avatarSize: 80, color: "#f8fafc", text: "Glaucia\ntech lead (human)", subColor: SUB, subSize: 25 },
        { id: "chat", step: 1, x: 340, y: 215, w: 370, h: 160, color: C.purple, fill: "rgba(139,92,246,.22)", text: "Group chat\nWorkshop - Packt Grok Bot", subColor: "#c4b5fd", subSize: 25 },
        { id: "fde", step: 2, x: 760, y: 5, w: 260, h: 175, avatar: A("fde-typescript"), color: C.blue, text: "FDE TypeScript\nbuilds + opens PR", subColor: SUB, subSize: 25 },
        { id: "qa", step: 3, x: 760, y: 208, w: 260, h: 175, avatar: A("qa-bot"), color: C.pink, text: "QA bot\nverifies vs. §5", subColor: SUB, subSize: 25 },
        { id: "ops", step: 4, x: 760, y: 411, w: 260, h: 175, avatar: A("devops"), color: C.orange, text: "DevOps\nCI + preview", subColor: SUB, subSize: 25 },
        { id: "pr", step: 5, x: 1120, y: 215, w: 295, h: 160, color: C.green, fill: "rgba(34,197,94,.2)", text: "PR + evidence\ntests · report · URL", subColor: SUB, subSize: 25 }
      ],
      edges: [
        { step: 1, from: "me", to: "chat", label: "asks", size: 27 },
        { step: 2, from: "chat", to: "fde", color: C.blue }, { step: 3, from: "chat", to: "qa", color: C.pink }, { step: 4, from: "chat", to: "ops", color: C.orange },
        { step: 5, from: "fde", to: "pr", color: C.blue }, { step: 5, from: "qa", to: "pr", color: C.pink }, { step: 5, from: "ops", to: "pr", color: C.orange },
        { step: 6, points: [[1270, 385], [1270, 645], [125, 645], [125, 402]], color: C.red, label: "I approve + merge", labelColor: "#fecaca", size: 28, lx: 520, ly: 645 }
      ]
    });

    // 3 · The loop (5 clicks)
    sketch(document.getElementById("d-loop"), { w: 1420, h: 610, seed: 21,
      nodes: [
        { id: "fde", step: 1, x: 10, y: 50, w: 250, h: 180, avatar: A("fde-typescript"), color: C.blue, text: "FDE TypeScript\nbuilds on a branch", subColor: SUB, subSize: 25 },
        { id: "pr", step: 2, x: 350, y: 75, w: 210, h: 130, color: C.gray, text: "Pull request", size: 32 },
        { id: "ci", step: 2, x: 650, y: 75, w: 240, h: 130, color: C.orange, fill: "rgba(249,115,22,.2)", text: "CI + preview\nActions · Vercel", subColor: SUB, subSize: 25 },
        { id: "qa", step: 3, x: 975, y: 50, w: 250, h: 180, avatar: A("qa-bot"), color: C.pink, text: "QA bot\ntests the commit", subColor: SUB, subSize: 25 },
        { id: "q", step: 4, x: 980, y: 285, w: 240, h: 160, shape: "diamond", color: C.amber, text: "all PASS?", size: 30 },
        { id: "ok", step: 4, x: 1120, y: 470, w: 290, h: 135, avatar: A("glaucia"), avatarSize: 56, color: C.green, fill: "rgba(34,197,94,.18)", text: "I approve + merge", size: 28 }
      ],
      edges: [
        { step: 2, from: "fde", to: "pr", label: "opens", size: 27 }, { step: 2, from: "pr", to: "ci" }, { step: 3, from: "ci", to: "qa" },
        { step: 4, from: "qa", to: "q" }, { step: 4, from: "q", to: "ok", label: "yes", labelColor: "#4ade80", lx: 1270, ly: 440, size: 27 },
        { step: 5, from: "q", to: "fde", via: [470, 470], color: C.red, label: "FAIL → fix only that", labelColor: "#fca5a5", lx: 520, ly: 530, size: 28 }
      ],
      notes: [ { step: 5, x: 950, y: 300, anchor: "end", text: "BLOCKED = missing access,", size: 27, color: "#fbbf24" }, { step: 5, x: 950, y: 334, anchor: "end", text: "not a pass", size: 27, color: "#fbbf24" } ]
    });
  }
  window.drawDiagrams = draw;
})();
