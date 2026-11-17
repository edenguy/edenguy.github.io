# Suggestions pill and request sheet: mockup

Static, no server, no build. Open `index.html`. The collapsed "Mockup controls" fold switches state, host screen, language (en / he, flips `dir`), theme, the environment pill and where the pill sits while scrolling. The view is the query string:
`?state=1..14&host=home|landing|newtrip|journal|captions&lang=en|he&theme=dark|light&env=sb|dev|none&float=1` (default: dark, English, sb, state 1).
Files: `index.html`, `mock.css` (colours copied from `docs/mockups/new-trip`, fields, buttons), `hosts.css` + `hosts.js` (the five stand-in screens and the pill), `sheet.css` + `sheet.js` (the sheet and its states), `mock.js` (controls), `mock-i18n.js` (en, he). The engine item builds `feedback.js` and `feedback.css` from this; text becomes `feedback.*` keys in `lang/<l>/ui.yaml`.

## Screens

Host screens (light stand-ins, nothing is a real page); each has the Suggestions pill beside the Beta pill at the inline end of its top bar:
- `home`: the no-trip home page at `/`. `landing`: `landing.html`. `newtrip`: the new-trip page, whose bar also carries the theme and language chips. `journal`: a trip page in the journal view (top bar variant, with the five-tab bottom nav).
- `captions`: the **floating** variant, because the helper page has no top bar: the pill is fixed at the inline end, bottom. `float=1` shows the same fixed pill on any host; above a bottom nav it sits 12 px over the nav (z-index 44, below the mode toast 48 and the photo viewer 50; the sheet itself is 60).

The pill: icon (speech bubble) and the word, never colour alone; 28 px visual, 44 x 44 px hit area; 3 px focus ring on the visual; violet tint and outline against Beta's grey outline, so it reads as a button. At 440 px and narrower the brand word is hidden on every host to make room (the mark stays); this is a finding for the real bars too, the new-trip bar does not fit pill, two chips and the brand word at 390 px.

The sheet: a bottom sheet, full screen at 390 px and a centred 560 px wide bottom-anchored sheet from 700 px. `role=dialog` with `aria-modal` and a label, dim backdrop (click closes), close button, Tab stays inside, Escape closes, focus returns to the pill. Eyebrow pill, Fraunces title with one italic accent word. Text area with a visible label and a counter (limit 4000); optional name (limit 80, "Anonymous is fine"); image picker (png, jpeg, webp, one image, up to 1.5 MB) with preview, name, size, remove; a read-only line saying what is sent (this page, the language, light or dark, the screen size; never the link or password); one primary Send, one secondary Cancel. Hebrew is mirrored with logical properties.

States (numbers match the switcher):
1. Pill only, sheet closed. 2. Sheet empty (Send on empty shows an inline error and moves focus to the text; the button is never silently disabled). 3. Filled. 4. Image attached. 5. Image shrunk automatically ("We made it smaller: 3.1 MB to 0.9 MB"). 6. Image refused (wrong type; a picture still over 1.5 MB after shrinking gets its own text, shown by choosing a non-image file or a very large one in the live sheet). 7. Sending (button busy, fields locked). 8. Sent ("We read every one", Close, Send another). 9. Failed, no connection (text and image kept, Try again). 10. Failed, too many requests (says to wait about 15 minutes). 11. Failed, server error. 12. Closed (feature switched off, calm message, no form). 13. Text near the limit (3,950 of 4,000, amber). 14. Over the limit (4,012: counter red, message says how many characters to cut, Send refuses).

The live sheet also works: type, pick a file (a real file's name and size are shown; over 1.5 MB is "shrunk"), Send shows the sending state for about a second and then the sent state. Nothing leaves the page.

## What to approve

- The pill beside Beta, its look and its words on all five hosts; the floating variant on captions.
- The sheet layout and the wording, English and Hebrew.
- The failure states: text and image are always kept, and every failure has Try again.
- The "sent with it" line: exactly what the real feature may attach.

## Checked

Every state on each host at 390 x 844 and 1280 x 800, English and Hebrew, dark and light: no console error, no horizontal scroll, exactly one pill. Contrast (WCAG): muted text 7.1 dark and 7.0 light on the surface, the pill ink 15.0 and 14.5 on its tint, the environment pills at least 5.0 in light. Escape and the focus return, the Tab trap, the empty-send error and reduced motion (the spinner stops) were exercised in a browser.

## Open design questions for the owner

- Label: "Suggestions" (decided) versus "Requests"; the sheet title says "Tell us what to change".
- Must the pill stay reachable while the page scrolls? The product's badge row scrolls away today. The fixed variant (`float=1`) keeps it on screen but covers a corner of the content.
- Is the name field asked at all, or is anonymous the only option? It is optional here.
- Should the sent state show a reference number (for example for a follow-up), or stay anonymous with only "Thanks"?
- Should an over-limit text be blocked on Send (as here) or cut at 4000 while typing?
- Should "too many requests" say the exact minutes (the server knows) or only "a little later"?
- Hebrew strings are written by the author and are not reviewed by a native editor.
