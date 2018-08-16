import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, Platform } from 'ionic-angular';
import { AuthService } from '../../auth.service';
import { StartPage } from '../start/start';
import { NowTeachersPage } from '../now-teachers/now-teachers';
import { NowStudentsPage } from '../now-students/now-students';
import { GooglePlus } from '../../../node_modules/@ionic-native/google-plus';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, private a: AuthService, public alertCtrl: AlertController, public plt: Platform, public googlePlus: GooglePlus) {
    
  }

  ionViewDidAppear() {
  }

  async signin() {
    if (this.plt.is('cordova')) {
      let user = await this.googlePlus.login({scopes: "profile email"})

      if (user.email.split('@')[1] == 'gmail.com') {
        let modal = this.alertCtrl.create({
          title: "There was an error signing you in.",
          subTitle: "Non-G Suite Google Accounts are not supported. Please sign in with a G Suite Account.",
          buttons: ['Dismiss']
        });
        modal.present();
        this.googlePlus.disconnect()
        return
      }

      let token = user.idToken;
      let value = await this.a.serverSignin(token)
      console.log(token)
      if (!value[0]) {
        this.googlePlus.disconnect()
        let modal = this.alertCtrl.create({
          title: "There was an error signing you in.",
          subTitle: "Something's wrong with your Google signin, please try again.",
          buttons: ['Dismiss']
        });
        modal.present();
        return
      }

      localStorage.setItem('email', user.email)

      let user_exists = await this.a.userExists(user.email);
      this.a.user = user
      if (user_exists[0]) {
        if (user_exists[1]) {
          this.navCtrl.push(NowTeachersPage);
        } else {
          this.navCtrl.push(NowStudentsPage);
        }
      } else {
        this.navCtrl.push(StartPage);
      }
      localStorage.setItem('signedIn', "true")
    }
    let user = await gapi.auth2.getAuthInstance().signIn({

    })
    if (user.getHostedDomain()) {
      let token = user.getAuthResponse().id_token;
      let value = await this.a.serverSignin(token);

      if (!value[0]) {
        gapi.auth2.getAuthInstance().disconnect();
        let modal = this.alertCtrl.create({
          title: "There was an error signing you in.",
          subTitle: "Something's wrong with your Google signin, please try again.",
          buttons: ['Dismiss']
        });
        modal.present();
        return
      }

      localStorage.setItem('email', user.getBasicProfile().getEmail())

      let user_exists = await this.a.userExists(user.getBasicProfile().getEmail());

      if (user_exists[0]) {
        if (user_exists[1]) {
          this.navCtrl.push(NowTeachersPage);
        } else {
          this.navCtrl.push(NowStudentsPage);
        }
      } else {
        this.navCtrl.push(StartPage);
      }
      localStorage.setItem('signedIn', "true")
    } else {
      let modal = this.alertCtrl.create({
        title: "There was an error signing you in.",
        subTitle: "Non-G Suite Google Accounts are not supported. Please sign in with a G Suite Account.",
        buttons: ['Dismiss']
      });
      modal.present();
      user.disconnect();
    }
  }

}
