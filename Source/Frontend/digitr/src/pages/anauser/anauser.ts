import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ToastController, Modal, ModalController, UrlSerializer } from 'ionic-angular';
import { AuthService } from '../../auth.service';
import { MessagePage } from '../message/message';

/**
 * Generated class for the AnauserPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-anauser',
  templateUrl: 'anauser.html',
})
export class AnauserPage {
  user;

  history: any[];

  isAdmin = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public alertCtrl: AlertController, public toastCtrl: ToastController, public modalCtrl: ModalController) {
    this.user = navParams.get('user')
    this.history = this.user.history;

    this.history = this.history.reverse();

    this.isAdmin = navParams.get('isAdmin')
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AnauserPage');
  }

  async remove() {
    let alert = this.alertCtrl.create({
      title: "Are you sure you would like to remove " + this.user.name + "?",
      subTitle: "This is an irrevocable action.",
      buttons: [
        {
          text: "No",
          role: "cancel"
        }, {
          text: "Yes",
          handler: () => {
            this.a.remove(this.user.email);
          }
        }
      ]
    });
    alert.present();
  }

  done() {
    this.navCtrl.pop()
  }

  tts(timestamp): string {
    let date = new Date(timestamp * 1000);
  
    return date.toLocaleString('en-US')
  }

  totalTime(start: number, minutes: number, end?: number): string {
    if (end) {
      let seconds = end - start;
      let mminutes = Math.floor(seconds / 60)
      let mseconds = Math.floor(seconds) % 60

      if (mminutes > minutes || (mminutes == minutes && mseconds > 0) ) {
        return +mminutes + ":" + +mseconds + " (Overtime)"
      } else {
        return +mminutes + ":" + +mseconds
      }
    } else {
      return ""
    }
  }
  send() {
    let modal = this.modalCtrl.create(MessagePage, {name: this.user.name});
    modal.onDidDismiss((value => {
      if (value) {
        this.a.sendMessage(this.user.email, value.text).then(() => {
          let toast = this.toastCtrl.create({
            message: "Message to " + this.user.name + " was sent.",
            showCloseButton: true,
            duration: 3000
          })
          toast.present()
        })
      }
    }))
    modal.present()
  }

  async removePass(timestamp) {
    await this.a.purge_pass(timestamp, this.user.email);

    let alert = this.alertCtrl.create({
      title: "Pass was removed successfully.",
      buttons: ["Dismiss"]
    })

    alert.present()
  }

  async sendBack(timestamp) {
    await this.a.send_back(timestamp, this.user.email);

    let alert = this.alertCtrl.create({
      title: "Person was sent back.",
      buttons: ["Dismiss"]
    })

    alert.present()
  }

}
