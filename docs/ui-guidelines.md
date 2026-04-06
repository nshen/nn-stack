# UI Guidelines

## `@nn-stack/ui` Package Rules

- Install shadcn components with: `pnpm dlx shadcn@latest add <component> -c packages/ui` (run from root folder)
- Note: use `shadcn@latest`, not `shadcn-ui@latest`
- Never modify code in `@nn-stack/ui`

### Imports

```ts
// Correct
import { Button } from '@nn-stack/ui/components/button'

// Incorrect
import { Button } from '@nn-stack/ui/button'
```

The `tsconfig.json` path mapping `@nn-stack/ui/*` points to `packages/ui/src/*`.

### Adding a New Component

1. Check if it exists in `@nn-stack/ui`
2. If not, install it: `pnpm dlx shadcn@latest add <component> -c packages/ui`
3. Import and use it from `@nn-stack/ui`

### Component Specific Rules

- **Dialog Width**: `DialogContent` has a default `sm:max-w-lg` class. To set wider (e.g., `max-w-4xl`), you MUST add `sm:` prefix: `sm:max-w-4xl`.

## Styling

- Only use Tailwind CSS V4. No CSS inline styles.
- Follow mobile-first responsive design principles.
- The `cn` utility must be imported from `@nn-stack/ui/lib/utils`. Do not create a local `lib/utils.ts`.
- Icons: only use `lucide-react`, no SVG allowed.

## Design Principles (Refactoring UI)

### Spacing and Sizing

- Use Tailwind's spacing scale (base unit `0.25rem` / `4px`). Avoid arbitrary values.
- Use empty space (padding/margins) to group and separate elements, not borders.

### Color

- Establish a constrained palette: neutrals (grays), primary color, semantic colors (success/warning/error).
- Use primary color for primary actions only. Most text should be dark gray (e.g., `text-slate-800`), not pure black.

### Typography

- Use Tailwind's font-size scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`).
- Stick to a few font weights (`font-normal`, `font-medium`, `font-semibold`).
- Create hierarchy through font weight and color, not just size.

### Visual Hierarchy and Depth

- Use subtle shadows (`shadow-sm`, `shadow-md`) for elevation.
- Prefer box shadows or background colors over borders. When using borders, keep them subtle (`border-slate-200`).

### Component Design

- **Buttons**: Clear primary (solid), secondary (outline), tertiary (ghost) styles with `hover` and `focus` states.
- **Forms**: Labels above inputs. Consistent height for all form controls. Visible `focus` states (`focus:ring-2`).
- **Icons**: Use `lucide-react` consistently. Pair icons with text unless meaning is universally understood.
