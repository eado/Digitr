import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { StartPage } from '../pages/start/start';
import { ServerconnService } from '../serverconn.service';
import { AuthService } from '../auth.service';
import { EulaPage } from '../pages/eula/eula';
import { NowStudentsPage } from '../pages/now-students/now-students';
import { NowTeachersPage } from '../pages/now-teachers/now-teachers';
import { FormsModule } from '../../node_modules/@angular/forms';
import { TeachersPage } from '../pages/teachers/teachers';
import { ApprovepassPage } from '../pages/approvepass/approvepass';
import { TimerPage } from '../pages/timer/timer';
import { GooglePlus } from '../../node_modules/@ionic-native/google-plus';
import { Push } from '@ionic-native/push';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AnauserPage } from '../pages/anauser/anauser';
import { MessagePage } from '../pages/message/message';
import { WhatsnewPage } from '../pages/whatsnew/whatsnew'; 

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    StartPage,
    NowStudentsPage,
    NowTeachersPage,
    EulaPage,
    TeachersPage,
    ApprovepassPage,
    TimerPage,
    AnauserPage,
    MessagePage,
    WhatsnewPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      mode: 'ios',    
      platforms: {
        ios: {
          tabsHideOnSubPages: true
        }
      }
    }),
    FormsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    StartPage,
    NowStudentsPage,
    NowTeachersPage,
    EulaPage,
    TeachersPage,
    ApprovepassPage,
    TimerPage,
    AnauserPage,
    MessagePage,
    WhatsnewPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ServerconnService,
    AuthService,
    GooglePlus,
    Push,
    ScreenOrientation
  ]
})
export class AppModule {}
