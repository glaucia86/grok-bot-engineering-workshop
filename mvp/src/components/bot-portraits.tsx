import type { CSSProperties } from "react";

// Display only the avatar region of each supplied screenshot. Original PNG bytes
// remain intact; no eyes, layers, or missing animation frames are generated.
const portraits = [
  { id: "fde", file: "fde-typescript", width: 278, height: 208, x: 100, y: 10 },
  { id: "qa", file: "qa-bot", width: 312, height: 198, x: 120, y: 0 },
  { id: "lead", file: "engineering-lead", width: 316, height: 206, x: 118, y: 8 },
  { id: "grok", file: "grok-bot", width: 316, height: 225, x: 120, y: 2 },
  { id: "devops", file: "devops-sre", width: 310, height: 193, x: 116, y: 0 },
];

export function BotPortraits({ interactive = false }: { interactive?: boolean }) {
  return portraits.map(bot => <span key={bot.id} className="bot-float" data-bot={bot.id} data-bot-depth={interactive && bot.id === "grok" ? 1 : undefined} data-bot-tilt={interactive && bot.id === "grok" ? 1 : undefined}>
    <span className="bot-portrait" style={{
      backgroundImage: `url('/bots/${bot.file}.png')`,
      backgroundSize: `${bot.width / 80 * 100}% ${bot.height / 80 * 100}%`,
      backgroundPosition: `calc(${-bot.x / 80} * var(--sprite-size)) calc(${-bot.y / 80} * var(--sprite-size))`,
    } as CSSProperties} />
  </span>);
}

