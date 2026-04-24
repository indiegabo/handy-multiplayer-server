import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { HMSUser } from '../../../models/user';
import { Size } from 'src/app/shared/utils/size';
import { AuthService } from 'src/app/core/services/hms/auth.service';
import { Subscription } from 'rxjs';

type ImageAlignment = 'left' | 'center' | 'right';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  standalone: false,
})
export class UserAvatarComponent implements OnInit, OnDestroy {
  @Input({ alias: 'user', required: true }) user!: HMSUser;
  @Input() size: Size = { width: 36, height: 36 };
  @Input() borderWidth = 1;
  @Input() clickable?: boolean;
  @Input() tooltip = '';
  @Input() alignment: ImageAlignment = 'center';

  userChangeSubscription?: Subscription;

  constructor(
    private authService: AuthService,
  ) {

  }
  ngOnInit(): void {
  }
  ngOnDestroy(): void {
  }
}
