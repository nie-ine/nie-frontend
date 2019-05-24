import {Component, OnInit} from '@angular/core';
import {AuthService} from './user-action-engine/mongodb/auth/auth.service';
import { environment } from '../environments/environment.prod';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    console.log( 'App Component ts' );
    this.authService.autoAuthUser();
    this.http.get('assets/config/environment.json')
      .subscribe(
        config => {
          localStorage.setItem( 'node', ( config as any ).node );
          console.log( localStorage.getItem('node'), environment );
        }
      );
  }
}
