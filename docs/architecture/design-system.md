# Shared design system

The UI layer in `components/ui/` owns reusable visual primitives. Product screens should compose these primitives instead of rebuilding borders, surfaces, status colors, and control states locally.

## Semantic tokens

`app/globals.css` defines light and dark values for backgrounds, text, borders, accent/secondary/reward/success states, focus, disabled opacity, spacing, radii, and elevation. Components consume these semantic variables so theme changes do not require screen-level class rewrites.

## Documented variants

| Primitive | Variants | Intended use |
| --- | --- | --- |
| `Button` | intent: accent, secondary, soft, outline, ghost, destructive, reward, success, warning; sizes: sm, md, lg, icon; `loading` | Actions and form submission, including disabled/loading feedback |
| `Surface` | card, muted, subtle, accent, success; padding and elevation | Cards, sections, panels, and feedback containers |
| `Badge` | neutral, accent, secondary, reward, success, destructive; sm/md | Short labels and status metadata |
| `FeedbackCard` | info, success, warning, error | Inline status, error, and completion feedback |
| `SectionHeader` | optional eyebrow, description, action | Consistent page and section headings |

All interactive variants retain the shared focus ring, disabled behavior, responsive sizing, and dark-theme semantic tokens. `Button loading` disables the action, exposes `aria-busy`, and announces a visible loading label.

## Migrated screens

- Public landing: hero badge and method cards.
- Authenticated dashboard: summary cards, section headers, badges, and learning surfaces.
- Account settings: profile/preferences/security/privacy surfaces and feedback cards.
- Learning: tutor preflight surface and existing shared button variants.

New screen-level patterns should be added to the primitive API or documented as an intentional exception.
