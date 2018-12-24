import { Component, SimpleChange } from '@angular/core';
import { Platform, LoadingController, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { StartPage } from '../pages/start/start';
import { AuthService } from '../auth.service';
import { NowTeachersPage } from '../pages/now-teachers/now-teachers';
import { NowStudentsPage } from '../pages/now-students/now-students';
import { GooglePlus } from '@ionic-native/google-plus'
import { ScreenOrientation } from '@ionic-native/screen-orientation';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any;

  auth2;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private a: AuthService, private googlePlus: GooglePlus, public so: ScreenOrientation) {
    
    
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.overlaysWebView(true);
      statusBar.isVisible = true;
      statusBar.styleDefault()

      splashScreen.hide();

      if (localStorage.getItem('microsoft')) {
        this.a.msLoginCallback = () => {
          this.a.getMsData().then(value => {
            if (value.user_exists) {
              if (value.is_teacher) {
                this.rootPage = NowTeachersPage
              } else {
                this.rootPage = NowStudentsPage
              }
            } else {
              this.rootPage = StartPage
            }
            localStorage.setItem('signedIn', "true")
            localStorage.setItem('name', value.displayName)
            localStorage.setItem('email', value.userPrincipalName)
          })
        }
        this.a.msCallback()
      } else {
        if (platform.is('cordova')) {
          so.unlock()
          console.log('ios')
          this.googlePlus.trySilentLogin({
            scopes: 'profile email',
            offline: false
          }).then(
            (user) => {
              if (user) {
                this.a.user = user;
                this.a.userExists(localStorage.getItem('email')).then(
                  (exists) => {
                    if (exists[0]) {
                      if (exists[1]) {
                        this.rootPage = NowTeachersPage;
                      } else {
                        this.rootPage = NowStudentsPage;
                      }
                      this.a.serverSignin(user.idToken)
                    } else {
                      this.rootPage = StartPage;
                    }
                    splashScreen.hide();
                  }
                )
              } else {
                this.rootPage = HomePage;
                splashScreen.hide()
              }
            }
          ).catch(
            () => {
              this.rootPage = HomePage;
              splashScreen.hide()
            }
          )
        } else {
          if (!(localStorage.getItem('signedIn') == "true")) {
            this.rootPage = HomePage
          }
          let timeout = true;
  
          setTimeout(() => {
            if (timeout) {
              this.rootPage = HomePage
            }
          }, 2000)
  
          gapi.load('auth2', () => {
            this.auth2 = gapi.auth2.init({}).then(
              (auth) => {
                if (auth.isSignedIn.get()) {
                  this.a.userExists(localStorage.getItem('email')).then(
                    (exists) => {
                      timeout = false;
                      if (exists[0]) {
                        if (exists[1]) {
                          this.rootPage = NowTeachersPage;
                        } else {
                          this.rootPage = NowStudentsPage;
                        }
                        this.a.serverSignin(auth.currentUser.get().getAuthResponse().id_token)
                      } else {
                        this.rootPage = StartPage;
                      }
                      splashScreen.hide();
                    }
                  )
                } else {
                  this.rootPage = HomePage;
                  splashScreen.hide()
                }
              }
            )
          });
        }
      }
    });
  }
}

