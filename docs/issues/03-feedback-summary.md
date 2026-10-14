# Feedback summary per talk

Add `GET /talks/:talkId/summary` returning `{ talkId, count, latest }`, where
`latest` is the most recent feedback (or `null`). Include tests.
