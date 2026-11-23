# Leonida Air — Boarding Pass v2

![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)
![rank](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01-boardingpass-v2/rank.svg)
![reward](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01-boardingpass-v2/reward.svg)

Thirteen years of delays, two postponement stamps, and one flight that
finally boards. This entry is a GTA VI meme drawn as an airline boarding
pass — Leonida Air, service to Leonida — where the long wait for the game
is itemised the way an airline would print a fare: every charge on the
pass is a piece of that wait, and almost all of them cost nothing.

## What the pass says

- **4,811 days in the lounge, 2 trailers watched** — the wait, counted.
- Base fare — **$79.99**
- Sick days booked for launch week — 5 days, **$0.00**
- Trailer 2 rewatches — **$0.00**
- Leonida sales tax — **$0.00**
- **Total due: $79.99**

And along the bottom, the airline's reassurance to everyone still
standing at the gate:

> LOST LUGGAGE? WE WAITED 13 YEARS. YOUR BAG CAN WAIT.

## The entry

The meme image (`meme.png`) was posted publicly on X by
[@zenfrog934](https://x.com/zenfrog934), and `POST.json` records that
post. The entrypoint, `main.ts`, validates both files — the post record
must be a small JSON object carrying the post's URL, and the image must
be a structurally sound PNG, CRCs and all — then publishes them
unchanged.

Built for the [make.fun](https://make.fun) bounty **gta6-meme-x-01**.
