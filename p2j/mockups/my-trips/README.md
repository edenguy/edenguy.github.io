# My trips and find my trip: landing page mock

Static, no server or build. Open `index.html`. The collapsed "Mockup controls" fold switches state, language (en / he, flips `dir`), theme and environment; the address does the same: `?state=5&lang=he&theme=light&env=dev` (`env` = `sb`, `dev`, `none`; default dark, English, `sb`).
Files: `index.html`, `mock.css` (colours, hero, buttons), `app.css` (top bar, cards, search, notes, toast), `sheet.css` (the bottom sheet), `view.js` (draws page and sheets), `mock.js` (state, focus, fake send), `data.js` (invented trips), `mock-i18n.js` (en, he).

This is the page at `/` as the "my trips" landing: top bar (brand, Beta, environment pill, Suggestions pill, theme toggle, language chip), one primary button "Plan a new trip" (only when creation is open), the trips this device has opened, and a secondary "Find my trips" entry. Suggestions is a pill with an icon and the word; the feedback mock had not merged, so it is a stand-in to be replaced by that mock's pill.

## Two layers, and what each can honestly do
There are no accounts, so the server cannot list trips for a visitor.
- **A. This device's list.** Each trip page remembers, in one device-preference key outside the trip storage prefix, only: id, title, role, language, start and end dates, last-opened time. Never a link, credential or address. The landing shows it.
- **B. Find by e-mail.** An address field; the answer is the same for every address ("if this address owns trips, a mail is on its way") and the mail holds one plain-text list of the trips with links. A new phone has an empty list even if the person has trips: that is when "Find my trips" is offered (state 2), and it stays offered below a non-empty list.

## States (the numbers match the switcher)
1. Loading: skeleton cards and a skeleton where the button will be (the button waits for `GET /api/trips` to say creation is open).
2. Empty welcome (new device): headline, tagline, primary "Plan a new trip", the "open the link you were sent" hint, and a card with "Find my trips".
3. One trip. 4. Several trips: title (any language, `dir=auto`), dates with Upcoming / Under way / Past, role pill with icon and word, trip language, "Opened 2 hours ago", an Open affordance (the whole card is the link), "Remove from this device" with no confirmation and an Undo toast (8 s).
5. Many trips (8): search by title appears above 6, a count ("3 of 8 trips"), sorted by last opened, a "no match" state that offers clearing the search or finding by e-mail.
6. Creation closed: no create button, a calm note, the trips still listed.
7. Find sheet, empty: visible label, one primary "Send me my trips", the honest line (same answer for every address); an invalid address shows an inline error.
8. Sending: progress bar, field and button disabled, `aria-busy`. 9. Sent: "If this address owns trips, a mail is on its way", spam folder, wait a few minutes, "Send again" after a countdown (52 s here; 60 s real).
10. Failed, no connection (try again). 11. Failed, too many tries, with the wait (14 minutes; button disabled).
12. A card whose link may have expired: the note that the trip page will offer to mail a new link (the trip page's existing recover offer; not a new screen).
13. Clear this device's list: the privacy action on a shared device, "Clear the list" (danger outline) or "Keep it"; afterwards the empty welcome with "No trip was deleted".
The sheet is full screen at 390 px, centred on desktop; `role=dialog`, `aria-modal`, focus moved in, trapped, returned, Esc closes, the page behind is `inert`. Interactive in the mock: search, remove and undo, the find flow (type an `example.test` address and send), clear.

## What to approve
The two-layer model and its wording; the card content; "remove" without a confirm but with undo; the placement of "Find my trips" and "Clear this device's list"; that the landing is `/` itself. Fonts and tokens follow `docs/UX.md`. All trips, names and addresses are invented (`example.test`). Hebrew is realistic but unreviewed by a native editor.

## Open questions
- Group the list into Upcoming and Past, or one list sorted by last opened (as drawn)?
- How many trips before search appears (6 proposed)?
- Is "remove from this device" enough, or should there also be a "clear all" at the foot (drawn here as "Clear this device's list")?
- Show "Find my trips" when the list is not empty (drawn: yes, a quiet row below the list), or only when it is empty?
- The product name and mission line are undecided; the mock uses "Plan to Journal" and the existing tagline.
- Should the list show a viewer's trips (drawn: yes, role Viewer) or only trips with a member or owner link?
