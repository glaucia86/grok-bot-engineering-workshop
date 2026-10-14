/* Diagram specs, drawn in Excalidraw style by sketch.js + rough.js. */
(function () {
  const C = { red: "#ef4444", blue: "#3b82f6", pink: "#ec4899", orange: "#f97316", amber: "#f59e0b", green: "#22c55e", teal: "#14b8a6", purple: "#8b5cf6", gray: "#94a3b8" };
  const A = n => "assets/avatars/" + n + ".svg";
  function draw() {
    sketch(document.getElementById("d-arch"), { w: 1420, h: 600, seed: 3,
      nodes: [
        { id: "app", x: 255, y: 20, w: 540, h: 230, color: C.gray, dashed: true, text: "" },
        { id: "br", x: 10, y: 70, w: 190, h: 130, color: C.gray, text: "Browser\nform · dashboard", subColor: "#9aa3b5", subSize: 22 },
        { id: "ui", x: 285, y: 75, w: 220, h: 150, color: C.blue, fill: "rgba(59,130,246,.25)", text: "Next.js UI\nshadcn · Recharts", subColor: "#9aa3b5", subSize: 22 },
        { id: "api", x: 545, y: 75, w: 225, h: 150, color: C.purple, fill: "rgba(139,92,246,.25)", text: "Route handlers\n/api/feedback\nshared Zod schema", size: 27, subColor: "#9aa3b5", subSize: 21 },
        { id: "orm", x: 870, y: 80, w: 200, h: 120, color: C.teal, fill: "rgba(20,184,166,.22)", text: "Drizzle ORM" },
        { id: "db", x: 1135, y: 60, w: 270, h: 160, shape: "ellipse", color: C.green, fill: "rgba(34,197,94,.22)", text: "Neon Postgres\ntable: feedback", subColor: "#9aa3b5", subSize: 22 },
        { id: "pr", x: 30, y: 390, w: 220, h: 120, color: C.gray, text: "GitHub PR" },
        { id: "ci", x: 380, y: 375, w: 330, h: 150, color: C.orange, fill: "rgba(249,115,22,.2)", text: "GitHub Actions\nVitest · verify · Playwright", subColor: "#9aa3b5", subSize: 22 },
        { id: "pv", x: 860, y: 390, w: 300, h: 120, color: C.amber, fill: "rgba(245,158,11,.2)", text: "Vercel preview URL" }
      ],
      edges: [
        { from: "br", to: "ui" }, { from: "ui", to: "api" }, { from: "api", to: "orm" }, { from: "orm", to: "db", label: "SQL" },
        { from: "pr", to: "ci", label: "every PR", size: 21 }, { from: "ci", to: "pv", label: "deploy" },
        { from: "pv", to: "app", dashed: true, label: "serves", color: C.amber, lx: 800, ly: 345 },
        { from: "ci", to: "pv", via: [790, 580], dashed: true, label: "e2e on the real preview", color: C.pink, labelColor: "#f9a8d4", ly: 580, lx: 560 }
      ],
      notes: [ { x: 270, y: 14, text: "Next.js App Router · one repo, one deploy", size: 24, color: "#cbd5e1" },
               { x: 1410, y: 285, anchor: "end", text: "🔒 DATABASE_URL: only Vercel env + GitHub secret", size: 23, color: "#fbbf24" } ]
    });

    sketch(document.getElementById("d-team"), { w: 1420, h: 700, seed: 11,
      nodes: [
        { id: "me", x: 10, y: 200, w: 230, h: 190, avatar: A("glaucia"), avatarSize: 80, color: "#f8fafc", text: "Glaucia\ntech lead (human)", subColor: "#9aa3b5", subSize: 22 },
        { id: "chat", x: 350, y: 215, w: 290, h: 160, color: C.purple, fill: "rgba(139,92,246,.22)", text: "Group chat\nWorkshop - Packt Grok Bot", subColor: "#c4b5fd", subSize: 21 },
        { id: "fde", x: 760, y: 5, w: 260, h: 175, avatar: A("fde-typescript"), color: C.blue, text: "FDE TypeScript\nbuilds + opens PR", subColor: "#9aa3b5", subSize: 21 },
        { id: "qa", x: 760, y: 208, w: 260, h: 175, avatar: A("qa-bot"), color: C.pink, text: "QA bot\nverifies vs. §5", subColor: "#9aa3b5", subSize: 21 },
        { id: "ops", x: 760, y: 411, w: 260, h: 175, avatar: A("devops"), color: C.orange, text: "DevOps\nCI + preview", subColor: "#9aa3b5", subSize: 21 },
        { id: "pr", x: 1135, y: 215, w: 270, h: 160, color: C.green, fill: "rgba(34,197,94,.2)", text: "PR + evidence\ntests · report · URL", subColor: "#9aa3b5", subSize: 22 }
      ],
      edges: [
        { from: "me", to: "chat", label: "asks" },
        { from: "chat", to: "fde", color: C.blue }, { from: "chat", to: "qa", color: C.pink }, { from: "chat", to: "ops", color: C.orange },
        { from: "fde", to: "pr", color: C.blue }, { from: "qa", to: "pr", color: C.pink }, { from: "ops", to: "pr", color: C.orange },
        { points: [[1270, 385], [1270, 645], [125, 645], [125, 402]], color: C.red, label: "I approve + merge", labelColor: "#fecaca", size: 26, lx: 520, ly: 645 }
      ]
    });

    sketch(document.getElementById("d-loop"), { w: 1420, h: 610, seed: 21,
      nodes: [
        { id: "fde", x: 10, y: 50, w: 250, h: 180, avatar: A("fde-typescript"), color: C.blue, text: "FDE TypeScript\nbuilds on a branch", subColor: "#9aa3b5", subSize: 21 },
        { id: "pr", x: 350, y: 75, w: 210, h: 130, color: C.gray, text: "Pull request" },
        { id: "ci", x: 650, y: 75, w: 240, h: 130, color: C.orange, fill: "rgba(249,115,22,.2)", text: "CI + preview\nActions · Vercel", subColor: "#9aa3b5", subSize: 22 },
        { id: "qa", x: 975, y: 50, w: 250, h: 180, avatar: A("qa-bot"), color: C.pink, text: "QA bot\ntests the commit", subColor: "#9aa3b5", subSize: 21 },
        { id: "q", x: 980, y: 285, w: 240, h: 160, shape: "diamond", color: C.amber, text: "all PASS?", size: 28 },
        { id: "ok", x: 1120, y: 470, w: 290, h: 135, avatar: A("glaucia"), avatarSize: 56, color: C.green, fill: "rgba(34,197,94,.18)", text: "I approve + merge", size: 27 }
      ],
      edges: [
        { from: "fde", to: "pr", label: "opens" }, { from: "pr", to: "ci" }, { from: "ci", to: "qa" },
        { from: "qa", to: "q" }, { from: "q", to: "ok", label: "yes", labelColor: "#4ade80", lx: 1270, ly: 440 },
        { from: "q", to: "fde", via: [470, 470], color: C.red, label: "FAIL → fix only that", labelColor: "#fca5a5", lx: 520, ly: 520, size: 26 }
      ],
      notes: [ { x: 950, y: 300, anchor: "end", text: "BLOCKED = missing access,", size: 23, color: "#fbbf24" }, { x: 950, y: 330, anchor: "end", text: "not a pass", size: 23, color: "#fbbf24" } ]
    });
  }
  (document.fonts && document.fonts.load ? document.fonts.load('30px "Virgil"').catch(() => {}) : Promise.resolve()).then(draw);
})();
