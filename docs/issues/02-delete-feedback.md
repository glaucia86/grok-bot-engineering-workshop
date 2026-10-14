# Allow deleting a feedback entry

**As** an attendee, **I want** to delete a feedback I submitted by mistake.

## Acceptance criteria
- `DELETE /feedback/:id` returns `204` when the feedback exists.
- Returns `404` when the id does not exist.
- The deleted feedback no longer appears in `GET /feedback`.
- Tests cover the three cases above.
