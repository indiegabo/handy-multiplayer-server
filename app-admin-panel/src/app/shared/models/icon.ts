import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

export interface FaIcon {
  style: IconPrefix;
  name: IconName;
}

export interface FlagIcon {
  name: string;
}

export type IconSize = 'sm' | 'md' | 'lg' | 'xlg';

export const ICON_SMALL = 'sm';
export const ICON_MEDIUM = 'md';
export const ICON_LARGE = 'lg';
export const ICON_EXTRA_LARGE = 'xlg';

export const ICON_PRIMARY_COLOR = 'primary';
export const ICON_ACCENT_COLOR = 'accent';
export const ICON_WARN_COLOR = 'warn';
export const ICON_COMFORT_COLOR = 'comfort';
