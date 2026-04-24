import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationSection } from
  'src/app/shared/components/navigation/navigation-item';
import { NAVIGATION_SECTIONS } from 'src/app/config/navigation';

/**
 * Global registry for navigation sections.
 * Starts with any eagerly-provided sections (optional),
 * and allows programmatic registration (e.g., from file loader).
 */
@Injectable({ providedIn: 'root' })
export class NavigationRegistryService {
  private readonly subject = new BehaviorSubject<NavigationSection[]>([]);
  readonly sections$ = this.subject.asObservable();

  constructor(
  ) {
    const sections = NAVIGATION_SECTIONS
      .filter((section) => section.items && section.items.length > 0)
      .sort((a, b) =>
        (a.meta.order || Infinity) - (b.meta.order || Infinity)
      );
    this.subject.next(sections);
  }

  getSections(): NavigationSection[] {
    return this.subject.getValue();
  }
}
