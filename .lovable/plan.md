# Remove divider lines next to swap button in Horizontal split

## Goal
In Horizontal split view, the swap button currently sits inside the `divide-x` flex container, so thin vertical divider lines appear immediately to its left and right. Remove those divider segments while keeping the button positioned between the source and target panels.

## What will change
- Refactor the Horizontal split layout in `src/routes/index.tsx` so the swap button is no longer a flex child of the `divide-x` container.
- Place the swap button as an overlay (or adjacent wrapper) between the source section and the target columns so no border passes through it.
- Keep the existing behavior: source panel left, target columns right, horizontal scroll on overflow, equal-width columns, and the swap button vertically aligned with the language pills.

## Steps
1. Re-read the current Horizontal split JSX block in `src/routes/index.tsx`.
2. Restructure so source and targets live in the divided/scrollable row, and the swap button floats in the gap (e.g., absolute positioning over the divider or a separate wrapper that spans the divider).
3. Verify the vertical lines beside the swap button are gone.
4. Run the build check and confirm no regressions.

## Technical detail
Current structure:
```
<div className="flex min-w-full items-stretch divide-x divide-border">
  <section source />
  <div>{SwapControl}</div>
  <div target />
  ...
</div>
```
The `<div>{SwapControl}</div>` is a flex child, so `divide-x` renders borders on both sides of it.

New approach: move the swap button outside the `divide-x` row (for example, wrap the row in a relative container and position the button absolutely between source and targets), or split the row into source-side and targets-side containers with the button between them.

## Verification
- Preview in Horizontal split mode.
- Confirm the swap button has no adjacent vertical lines.
- Confirm scrolling, panel widths, and swap behavior remain unchanged.
