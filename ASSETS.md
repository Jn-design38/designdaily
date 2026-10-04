# Design assets

## Morrow — original studio concept

Morrow is a fictional specialty-coffee brand created to demonstrate a complete identity system. It is not presented as commissioned client work. No third-party logo has been copied.

The sunrise symbol, layouts, packaging illustrations, and campaign copy are original project artwork. The twelve SVG files in `assets/morrow/` are editable vectors with embedded Poppins Bold so they render consistently without a font download. The SIL Open Font License is included at `assets/OFL-Poppins.txt`.

Run `npm run assets` to rebuild the SVG files from `create-brand-assets.mjs`.

| Asset | Use |
| --- | --- |
| logo.svg | Primary sunrise mark and wordmark |
| business-front.svg, business-back.svg | Two-sided business card |
| letterhead.svg, envelope.svg | Stationery system |
| coffee-bag.svg, coffee-cup.svg | Packaging and takeaway applications |
| tote.svg | Canvas-bag illustration |
| billboard.svg | Outdoor campaign artwork |
| social-slow.svg, social-pause.svg, social-ritual.svg | Three social campaign posters |

The cup, bag, and tote are intentionally illustrated mockups. Their transparent SVG backgrounds let each object move independently in the browser's 3D scene.

The built-in image-generation tool was attempted but returned an expired-connection error. No new generated image or API fallback was used for Morrow. The original vector artwork is the final asset set.

## Existing photography

- Architecture: Adam Borkowski, Pexels photo 4512299 — https://www.pexels.com/photo/orange-concrete-building-4512299/
- Paper: Edward Jenner, Pexels photo 4252515 — https://www.pexels.com/photo/close-up-shot-of-brown-paper-and-patterns-4252515/
- Leaf: Sarah Dorweiler, Pexels photo 8408553 — https://www.pexels.com/photo/close-up-photo-of-a-green-leaf-of-a-plant-8408553/
- Existing foreground leaf cutout: generated for the earlier website version and retained with transparency.
