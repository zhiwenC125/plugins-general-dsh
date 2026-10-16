# Revolution prototype state · 2026-10-17

File: https://www.figma.com/design/J3MYi2TF0UFcnzS86kZ2u3

Page `27:945`, home `27:968`, Workflow `27:1100`, Models `27:1528`.

18 top-level screens, all reachable from home; 245 ON_CLICK navigation reactions after removing current-page self links. Eight main components, 225 instances. Audited immediate auto-layout bounds: zero overflow after increasing Skills cards to 160px. Screenshots inspected: home and Workflow. Existing color variables reused; selected-state fill changed to dark green / pale green by mode. Prototype values and running states are examples, not live execution.

Source: `figma-revolution-prototype.js`, injected SVG: `../assets/revolution-fist.svg`. Existing populated page guard prevents accidental overwrite.
