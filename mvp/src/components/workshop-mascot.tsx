import { BotBlink } from "./bot-blink";

/** Original vector artwork. No reference-site paths, bundles or raster crops. */
export function WorkshopMascot() {
  return <span className="workshop-mascot" data-bot="grok" data-bot-depth="0.75" data-bot-tilt="1" aria-hidden="true">
    <BotBlink>
      <svg className="mascot-art" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
        <path className="mascot-body" d="M78 17C111 14 140 43 143 79C147 115 124 142 87 145C49 149 20 127 17 92C14 56 42 21 78 17Z" fill="#101516" />
        <g className="mascot-face" data-bot-depth="0.18" fill="#fff">
          <g transform="rotate(-22 78 61)"><ellipse className="mascot-eye" cx="78" cy="61" rx="5" ry="10" /></g>
          <g transform="rotate(-22 100 58)"><ellipse className="mascot-eye" cx="100" cy="58" rx="5" ry="10" /></g>
        </g>
      </svg>
    </BotBlink>
  </span>;
}
