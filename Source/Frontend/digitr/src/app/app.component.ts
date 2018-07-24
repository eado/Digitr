// declare var gapi: any;

import { Component } from '@angular/core';
import { Platform, LoadingController, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { StartPage } from '../pages/start/start';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      
      gapi.load('auth2', () => {
        let auth2 = gapi.auth2.init({});
        if (auth2.isSignedIn.get()) {
          this.rootPage = StartPage;
        } else {
          this.rootPage = HomePage;
        }
        auth2.isSignedIn.listen((signedIn) => {
          if (signedIn) {
            this.rootPage = StartPage;
          } else {
            this.rootPage = HomePage;
          }
        });

  
      });
    });
  }
}

