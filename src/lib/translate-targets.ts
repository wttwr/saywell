/** Replace the swapped target, or merge into the existing old-source target. */
export function swapTargets(targets: string[], active: number, oldSource: string) {
  const selected = targets[active];
  if (!selected) return null;

  const next = targets.includes(oldSource) && selected !== oldSource
    ? targets.filter((_, index) => index !== active)
    : targets.map((language, index) => index === active ? oldSource : language);
  const unique = [...new Set(next)];
  return { targets: unique, active: unique.indexOf(oldSource) };
}