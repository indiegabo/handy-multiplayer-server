import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExternalDispatcherService } from 'src/app/core/services/external-dispatcher.service';

@Component({
  selector: 'app-redirector',
  templateUrl: './redirector.component.html',
  styleUrls: ['./redirector.component.scss'],
  standalone: false,
})
export class RedirectorComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dispatcher: ExternalDispatcherService,
  ) {

  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => this.evaluateAndDispatch(params));
  }

  private evaluateAndDispatch(params: any): void {
    if (!params.key) {
      this.router.navigate(['/errors/not-found']);
      return;
    }

    const { key, ...realParams } = params;
    this.dispatcher.dispatch(key, realParams);
  }
}
