# Leonida Air — Boarding Pass v2

![competition](https://make.fun/badge/gta6-meme-x-01.svg)
![rank](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01-boardingpass-v2/rank.svg)
![reward](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01-boardingpass-v2/reward.svg)

Every GTA fan knows the wait. This entry turns that wait into the one
document we have all been holding for over a decade: an airline boarding
pass for the flight to Leonida, the home state of Grand Theft Auto VI.
One seat, one passenger, one departure that kept being pushed back until
the ticket itself became the joke.

## Your itinerary

- **Passenger:** all of us
- **Flight:** Leonida Air, gate "when it's ready"
- **Time in the lounge:** 4,811 days
- **Entertainment provided:** 2 trailers watched

Thirteen years of delays earn their own line items, so the fare block on
the pass reads the way the wait actually felt:

| Charge | Amount |
| --- | --- |
| Base fare | $79.99 |
| Sick days booked for launch week — 5 days, doctor approved | $0.00 |
| Trailer 2 rewatches — count lost in 2024 | $0.00 |
| Leonida sales tax | $0.00 |
| **Total due** | **$79.99** |

Printed along the bottom of the pass, for anyone whose bag goes missing
after all that:

> LOST LUGGAGE? WE WAITED 13 YEARS. YOUR BAG CAN WAIT.

## About this entry

The image was posted on X by [@zenfrog934](https://x.com/zenfrog934)
ahead of this submission, as the bounty requires. It is the final,
maximised version of the boarding-pass concept: the same proven layout,
with the lounge stay spelled out in days and the fare block itemised in
full.

Made for the [make.fun](https://make.fun) bounty **gta6-meme-x-01**.

## How the entrypoint works

`main.ts` is the harness entry. It validates `POST.json` (a small JSON
object carrying the X post URL) and `meme.png` (a full PNG chunk walk
with CRC-32 verification), then copies both, byte for byte, into the
output directory. If either file fails validation, nothing is copied.
