import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output, QueryList } from '@angular/core';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

@Component({
  selector: 'app-toggle-buttons-group',
  templateUrl: './toggle-buttons-group.component.html',
  styleUrl: './toggle-buttons-group.component.scss',
  standalone: false,
})
export class ToggleButtonsGroupComponent implements AfterContentInit {
  @Input() selectFirst?: boolean;
  @Input() spacing?: string;
  @ContentChildren(ToggleButtonComponent) contentChildren!: QueryList<ToggleButtonComponent>;
  @Output() valueChanged$ = new EventEmitter<any>();

  buttonSelected$ = new EventEmitter<ToggleButtonComponent>();
  activeButton?: ToggleButtonComponent;

  ngAfterContentInit() {
    this.contentChildren.forEach(button => {
      button.setGroup(this);
    });

    if (this.selectFirst) {
      const firstButton = this.contentChildren.first;
      firstButton?.setActive(true);
      this.selectButton(firstButton);
    }
  }

  selectButton(button: ToggleButtonComponent) {
    this.activeButton?.setActive(false);
    this.activeButton = button;
    this.activeButton?.setActive(true);

    this.buttonSelected$.emit(button);
    this.valueChanged$.emit(this.activeButton.value);
  }
}
