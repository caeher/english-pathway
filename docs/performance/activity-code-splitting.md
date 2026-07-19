# Activity code splitting

## Baseline

Before this change, the client `ActivityRenderer` statically imported all ten game renderers through `components/games`. Opening `/learn` therefore made every activity renderer and its transitive client dependencies eligible for the initial learn-route bundle, even when the panel was empty or showed one activity.

## Strategy and outcome

Each renderer now uses `next/dynamic` with `ssr: false`. The shared activity shell remains available immediately, while the selected game is requested only after the tutor opens that activity. This avoids server/client rendering mismatches for browser-oriented game dependencies and preserves tutor availability while a game chunk loads.

The loading placeholder reserves a minimum 14rem content region and announces loading status. A local error boundary presents an alert and a retry action that remounts only the activity attempt. Build output remains the reproducible route-level measurement; chunk names and sizes may vary between Next.js releases, so the enforced invariant is absence of static game imports in `ActivityRenderer` and per-renderer dynamic imports, covered by the regression test.
