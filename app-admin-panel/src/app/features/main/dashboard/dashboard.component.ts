import { Component, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/core/services/navigation.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit {

  constructor(
    private navigate: NavigationService,
  ) { }

  ngOnInit(): void {
    this.navigate.toPendingIfAny();
  }

  ngOnDestroy(): void {
  }
}
