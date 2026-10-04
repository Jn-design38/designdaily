# Design Daily

An independent design studio website with layered, scroll-driven scenes, local Poppins fonts, responsive layouts, and reduced-motion support.

Live website: https://Jn-design38.github.io/designdaily/

## Publishing

GitHub Pages serves the `main` branch from the repository root. No build step is needed. Keep `index.html`, `styles.css`, `script.js`, and the `assets` folder together.

## Making design changes

- `main` is the published version. Changes here update the live website.
- `design` is your working copy. Changes here do not affect the live website.
- Ask Codex to make your changes on `design`, preview them, and run `node check.mjs`.
- When you like the result, open a pull request from `design` into `main`. This shows exactly what will change.
- Merge the pull request when ready to publish. GitHub Pages then updates automatically.
- Keep the `design` branch after merging and bring it up to date with `main` before the next round of work.

A pull request is simply a review step before changes go live. You can ask Codex to handle the Git commands and publishing for you.

To preview locally, run `python -m http.server 8080` in this folder and open `http://localhost:8080`. GitHub Pages publishes one branch; the `design` branch does not get a separate live preview automatically.

Before publishing, check desktop and mobile layouts, images, navigation, forms, and the Motion toggle. Automatic checks validate JavaScript syntax, local asset references, and section links. They do not replace visual review.

If a published change needs undoing, revert its merged pull request on GitHub; Pages will redeploy the restored version.

The project form opens an email draft in the visitor's mail application. It does not submit to a backend.

## Assets

Poppins is distributed under the SIL Open Font License; see `assets/OFL-Poppins.txt`. Photography is from Pexels: Adam Borkowski (4512299), Edward Jenner (4252515), and Sarah Dorweiler (8408553). The foreground leaf cutout was generated for this website.
