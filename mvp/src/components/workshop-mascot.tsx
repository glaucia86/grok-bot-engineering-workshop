import { BotBlink } from "./bot-blink";

// Original workshop geometry, authored here rather than copied from an app bundle.
const characters = [
  { id: "grok", color: "#101516", shape: "blob", eyes: [[78, 61], [100, 58]], path: "M78 17C111 14 140 43 143 79C147 115 124 142 87 145C49 149 20 127 17 92C14 56 42 21 78 17Z" },
  { id: "fde", color: "#00C972", shape: "square", eyes: [[65, 83], [87, 81]], path: "M32 22H128Q138 22 138 32V128Q138 138 128 138H32Q22 138 22 128V32Q22 22 32 22Z" },
  { id: "qa", color: "#FF309B", shape: "drop", eyes: [[65, 91], [87, 89]], path: "M80 12C96 36 139 64 139 98C139 127 114 146 80 146C46 146 21 127 21 98C21 64 64 36 80 12Z" },
  { id: "devops", color: "#9159FE", shape: "drop", eyes: [[65, 91], [87, 89]], path: "M80 12C96 36 139 64 139 98C139 127 114 146 80 146C46 146 21 127 21 98C21 64 64 36 80 12Z" },
  { id: "lead", color: "#FF263C", shape: "wedge", eyes: [[55, 105], [77, 103]], path: "M28 30Q28 16 42 23L137 111Q150 126 132 132L40 145Q22 147 24 129Z" },
];

export function WorkshopMascot() {
  return <>{characters.map(({ id, color, shape, eyes, path }, phase) =>
    <span key={id} className="workshop-mascot" data-bot={id} data-shape={shape} aria-hidden="true">
      <span className="mascot-motion" data-bot-depth="0.45" data-bot-tilt="1">
        <BotBlink phase={phase}>
          <svg className="mascot-art" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
            <path className="mascot-body" d={path} fill={color} />
            <g className="mascot-face" data-bot-depth="0.65" fill={id === "grok" ? "#fff" : "#101516"}>
              {eyes.map(([x, y], index) => <g key={index} transform={`rotate(${id === "grok" ? -22 : -12} ${x} ${y})`}><ellipse className="mascot-eye" cx={x} cy={y} rx="5" ry="10" /></g>)}
            </g>
          </svg>
        </BotBlink>
      </span>
    </span>
  )}</>;
}
