# Remove the carousel panel divider

## Goal
Remove the vertical divider line that runs between the source and target panels in **Carousel** view, while keeping the swap button and two-column layout intact.

## Steps
1. In `src/routes/index.tsx`, strip `md:divide-x md:divide-border` from the carousel grid container.
2. Keep `md:grid-cols-2`, the source panel left padding (`md:pr-10`), and the target panel right padding (`md:pl-10`) so the layout stays spacious.
3. Leave the swap button absolutely centered between the two columns.
4. Verify the build is clean.

## Technical details
- The line is produced by `divide-x divide-border` on the grid wrapper at the carousel branch.
- Side and stacked view dividers are untouched.
- No other UI strings or behavior change.
