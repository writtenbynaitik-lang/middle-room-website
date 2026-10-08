# STEP 1 — PROJECT BRIEF

**Project name** Middle Room — Outreach Website Preview
**Business** Middle Room (@middleroomblr), Bengaluru
**Website type** Single-page immersive homepage concept (editorial music/culture, not restaurant template)
**Category** Listening bar / vinyl listening room, inside The Courtyard
**Audience** Bengaluru music listeners, audiophiles, vinyl & jazz-kissa culture, date-night/culture-led diners
**Objective** Turn a fragmented Linktree journey into one immersive digital home: what it is → why music is the centre → what the room feels like → what's on → food & drink → reserve
**Primary conversion** Reserve a seat (two-hour listening slot)
**Secondary** See the programme · Private booking enquiry
**Brand identity** Real Middle Room wordmark; deep red / warm black / warm wood-amber / paper beige / muted green; heavy editorial grotesque + mono "liner-notes" metadata
**Technical constraints** Static HTML/CSS/JS. Self-hosted fonts + local images (no network at capture time). No backend, payments, auth or CMS. Designed for a 1300×2080 capture viewport; responsive 320→1440+.
**Video requirement** ONE continuous top→bottom scroll, 7–8s, vertical 1080×1920

## Verified facts used (nothing invented)
| Fact | Source |
|---|---|
| "Listening Bar \| An ode to the intimate music & beer rooms of Bangalore" | their own linktr.ee/middleroomblr bio |
| "Vinyl, Craft Beers & Cocktails \| Tavern-style eats" | their own Instagram bio |
| "Music here isn't background; it's the reason you're in the room." | thecourtyard.in/middle-room (own site) |
| 33 seats | thecourtyard.in, thenodmag.com, mnine.in |
| Archive exceeding 1,200 vinyls — jazz, blues, rock, funk, dance, R&B | homegrown.co.in |
| Two-hour listening slots | homegrown.co.in |
| Full analogue Danley Sound Labs system: Synergy Horn SH75 mains, Tapped Horn TH Mini 15 subs | mixmag.asia |
| Jazz kissa + old-Bangalore music/beer room inspiration | thecourtyard.in, thenodmag.com, mnine.in |
| Akhila Srinivas (founder); Sri Rama Murthy / Murthovic (records & sonic identity); Avinash, Elsewhere India (music programme & design); Chef Adithya Kidambi (kitchen); Arijit Bose (beer & cocktails) | thecourtyard.in/middle-room |
| Birria dosa; buldak-sauce mac & cheese | thenodmag.com |
| Cheese balls | their own Instagram post |
| Series: Listening Session, Genre In Focus, Club Fridays, Selectors, Back to Bangalore | their own Instagram grid + highlights |
| Address 105 Kengal Hanumanthaiah Rd, Shanthinagar, Bengaluru 560027; info@thecourtyardcommunity.in; +91 73386 77996 | thecourtyard.in |
| Private booking WhatsApp +91 63649 42336; reservations urbanaut.app/spot/middle-room; YouTube @MiddleRoomBLR; WhatsApp community | their own linktr.ee |
| Press: Mixmag Asia, Homegrown, ET Hospitality, Curly Tales (linktree) + The Hindu, Elle Gourmet, Mint (their own Press highlight) | linktr.ee + Instagram highlights |

**Deliberately omitted** opening hours, reservation fee, prices, event dates, capacity claims, testimonials, awards, statistics — not verifiable as current.

## Assets
Official photography from **thecourtyard.in** (Middle Room's parent company): `room-red`, `vinyl-wall`, `bar`, `team`, `facade`, plus the real `logo.png` wordmark.
Curated stills from **Middle Room's own Instagram**: 5 session posters (shown as record-sleeve squares), cheese balls, two drink stills, one kitchen still. Instagram UI and carousel badges removed.
Press-owned editorial imagery (The Hindu / Elle / Mint screenshots) used as **research only** — never placed on the page; press is credited as text.

## Homepage structure
1 Hero — image band + wordmark + ode headline + reserve CTAs + spec strip
2 Manifesto — the verbatim quote + genre marquee
3 The Room — vinyl archive photo + calibrated-listening copy + real equipment spec table
4 Programme — paper panel, record-sleeve session artwork, series chips
5 Food & Drink — bar photo band + stills + verified dishes + kitchen/bar credits
6 The People — team photo + verified names and roles
7 Press — text-only marquee
8 Reserve — red panel + facade photo + address
9 Footer

---

# ROUND 2 — the real website

Scope changed from a 7.6s outreach preview to a buildable site: more animation, 3D, large type,
no paragraphs, higher-resolution photography. Deliverable is `site/`.

## New sources found in round 2
| Fact | Source |
|---|---|
| Interiors designed by **M9 Design Studio**; six project photographs at 3840px | mnine.in/middle-room |
| Photography by **Ekansh Goel** | credited on the M9 project |
| "warm wood, deep red accents and subdued grey walls"; "a prominent vinyl wall and exposed turntables form the visual and cultural heart of the room" | mnine.in/middle-room |
| "Designed by M9 Design Studio" for the Middle Room | designpataki.com |
| Danley Synergy Horn loudspeakers and tapped horn subs, "calibrated so that every detail finds its space" | tracksandtales.co |
| Menu (venue-supplied listing): Corn Custard, Manchurian, **Disco Pumpkin**, Butter Garlic Fried Rice, Sichuan Fried Rice, **Mac & Cheese**, Bangalore Grilled Chicken, Chicken 65, **Naga Pork**, Carbonara, Numbing Chocolate Mousse, Churro, **Cheese Ball** | rwi.puttingscene.com |
| Reservations now route through Swiggy Scenes (`r.swiggy.com/v1/swiggy/scenes/comms/100055597`), which their own Instagram bio links | linktr.ee/middleroomblr + their Instagram bio |

The five dishes used on the page — Birria Dosa, Mac & Cheese, Cheese Balls, Naga Pork,
Disco Pumpkin — are each corroborated by The Nod Mag, the Restaurant Week India listing, or
Middle Room's own Instagram.

## Checked and deliberately not used
- **Rs 1,000 entry, Rs 200 valet, 15-minute table hold** (explocity.com) — those belong to one
  specific November 2025 event, not to general reservations. No price appears on the site.
- **"Tuesday to Sunday"** slots — appeared only in a search summary, not in any source text.
  No opening hours on the site.
- **urbanaut.app/spot/middle-room** — the old Linktree reservation link now resolves to
  "we can't find the page". Replaced with the Swiggy Scenes link their Instagram bio uses.
- **thenodmag.com photography** and the Hindu / Elle Gourmet / Mint press screenshots — editorial
  property. Research only, never placed on the page.

## Asset pipeline
`research/assets.py` rebuilds every image in `site/assets/img` from the originals in
`research/m9`, `research/dl` and the supplied Instagram screenshots. Gutter trimming and carousel-
badge removal are automatic. `research/vectorize.py` traces the wordmark PNG into `logo.svg`
(marching squares at 6x + Ramer-Douglas-Peucker) so the real mark stays crisp at footer scale.
