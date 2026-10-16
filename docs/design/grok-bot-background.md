# Original native workshop mascot

The raster composition at cca348a was rejected and is superseded by one original SVG character integrated into the existing home loop illustration. The three approved routes, page copy, navigation, green/neutral identity, form and results remain in place. Feedback and results use the exact pre-mascot WorkshopShell from b21e262.

The character uses one authored body path and two native white ellipses. Body translation and tilt are bounded; a smaller nested face translation follows mouse direction. Eyes close by scaling their own vector geometry, not by covering a screenshot or deforming the face. The original PNG crops, raster resources and artificial black eyelid overlays are removed from the live application.

Motion uses the existing ref-based, settling requestAnimationFrame loop. Irregular 4–8 second blink pauses and a 140ms closure use one timer at a time. Fine mouse/hover/no-reduced-motion conditions gate both effects. Touch, coarse pointers and reduced motion retain a static character with open eyes. Runtime media changes, hidden documents and unmount clear/reset the effects. Decoration is aria-hidden, cannot intercept controls and has no tab stop.

See [the investigation](bot-motion-investigation.md) for actual REA/DevTools evidence, public URLs and limits. The official Grok rendering mechanism was not observed because Cloudflare returned 403. This implementation is original and does not claim to reproduce that hidden implementation.

Current desktop/mobile/reduced-motion and native-eye open/closed captures are stored in evidence/native-mascot. The rejected raster captures remain recoverable in Git history at cca348a and are excluded from the final candidate. Local fixture rendering is distinct from remote Preview access or database acceptance. No remote POST or Neon write is part of this change.
