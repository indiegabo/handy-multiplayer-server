// Keep lines ~90 cols for vertical monitors.

import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

export interface NavigationIcon {
  style: IconPrefix;
  name: IconName;
}

export interface NavigationItem {
  id: string;
  displayName: string;
  route?: string;
  icon?: NavigationIcon;
  active?: boolean;
  children?: NavigationItem[];
}

export interface NavigationSectionMeta {
  /** Unique section id */
  id: string;
  /** Ordering across sections (lower first). Default: 100 */
  order?: number;
  /** Optional flag to hide whole section via a runtime check */
  visible?: boolean;
  baseRoute?: string;
}

export interface NavigationSectionHeader {
  title: string;
  subtitle?: string;
  icon?: NavigationIcon;
}

export interface NavigationSection {
  meta: NavigationSectionMeta;
  header?: NavigationSectionHeader;
  /** Root items for this section */
  items: NavigationItem[];
}
