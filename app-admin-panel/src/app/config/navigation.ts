import { hmsNavigationSection } from "../navigation/hms.nav";
import { mainNavigationSection } from "../navigation/main.nav";
import { NavigationSection } from "../shared/components/navigation/navigation-item";

/**
 * Admin Sidebar Navigation — file-based sections registry
 * -------------------------------------------------------
 * How it works
 * - The sidebar reads sections from `NavigationRegistryService`, which exposes
 *   this `SECTIONS` array as-is.
 * - Each section is a `NavigationSection` defined in
 *   `src/app/navigation/*.nav.ts` (recommended) or declared inline below.
 *
 * Data model
 * - `header` (optional): visual info for the section header.
 *     - `title`, `subtitle?`, `icon?` (FontAwesome prefix/name).
 * - `meta`: section metadata and behavior flags.
 *     - `id` (unique), `order?`, `visible?`, `baseRoute?`
 *     - No automatic sorting or filtering is applied here.
 * - `items`: a tree of `NavigationItem` (id, displayName, route?, icon?, children?).
 *
 * Conventions
 * - Prefer absolute routes in items (e.g., '/app/hms/maintenance').
 * - If you use `meta.baseRoute`, compose item routes inside your `.nav.ts`
 *   file; the registry does not auto-prefix routes.
 * - To add a section: create `<feature>.nav.ts` exporting a `NavigationSection`,
 *   import it here, and append to `SECTIONS` in the order you want to display.
 */
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  mainNavigationSection,
  hmsNavigationSection,
];
