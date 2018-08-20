import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, Alert, ModalController } from 'ionic-angular';
import { ServerconnService } from '../../serverconn.service';
import { AuthService } from '../../auth.service';
import { ApprovepassPage } from '../approvepass/approvepass';
import { PushOptions, Push } from '@ionic-native/push';
import { AnauserPage } from '../anauser/anauser';

/**
 * Generated class for the NowTeachersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-now-teachers',
  templateUrl: 'now-teachers.html'
})
export class NowTeachersPage {
  first = true;

  user;
  district;

  currentPage = "messages"
  analyticsPage = "stats"

  dist;
  analytics;

  students;
  filteredStudents;
  stats;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public alertCtrl: AlertController, public modalCtrl: ModalController, public toastCtrl: ToastController, public push: Push) {
  }

  ionViewDidLoad() {
    let options: PushOptions = {
      ios: {
        alert: true,
        badge: false,
        sound: true
      },
      browser: {}
    }
    
    let pushObject = this.push.init(options);
    pushObject.on('registration').subscribe((reg) => {
      console.log(reg)
      this.a.setNotification(reg.registrationId)
    })
    
    console.log('ionViewDidLoad NowTeachersPage');
    this.a.getUser(localStorage.getItem('email'), (user) => {
      if (!this.first && user.messages) {
        user.messages = (user.messages as any[]).reverse()
        for (let message of user.messages) {
          let isNew = true
          for (let message2 of this.user.messages) {
            isNew = message.timestamp != message2.timestamp
          }
          if (Date.now() / 1000 - message.timestamp > 300) {
            this.dismiss(message.timestamp)
          }
          if (isNew) {
            let alert = this.alertCtrl.create({
              title: message.title,
              subTitle: message.subTitle,
              buttons: [
                {
                  text: "View",
                  handler: () => {
                    this.currentPage = "messages"
                  }
                }
              ]
            })
            alert.present()
            if (message.type == "pass_done") {
              this.playSound()
            }
          }
        }
      }
      this.user = user
      this.first = false;
    })
    this.a.getDistrictInfo().then(dist => {
      this.dist = dist;
      if (dist.analytics) {
        this.analytics = true
      } else {
        this.analytics = false
      }
      console.log(this.analytics)
    })
    this.getAnalytics()
  }

  async getAnalytics() {
    this.stats = await this.a.getTeacherStats()
    this.students = await this.a.getTeacherUsers()
    this.filteredStudents = this.students
  }

  deny(message: number, user: string) {
    console.log([message, user])
    this.a.denyPass(message, user)
  }

  approve(messageTime: number) {
    let message: any;
    for (let nmessage of this.user.messages) {
      if (nmessage.timestamp == messageTime) {
        message = nmessage
      }
    }
    let modal = this.modalCtrl.create(ApprovepassPage, {message: message});
    modal.onDidDismiss((value) => {
      console.log(value)
      if (!value.minutes) {
        return
      }
      this.a.approvePass(value.give, message.destination, value.minutes, message.email).then(
        () => {
          let toast = this.toastCtrl.create({
            message: "Pass successfully approved.",
            showCloseButton: true
          })
          toast.present()
          this.a.dismissMessage(message.timestamp)
        }
      )
    })
    modal.present();
  }

  dismiss(message: number) {
    this.a.dismissMessage(message)
  }

  playSound() {
    console.log('audio attempt')
    let audio = new Audio()
    audio.src = "assets/sound.mp3"
    audio.load()
    audio.play()
  }

  getItems(event) {
    let text = event.target.value
    this.filteredStudents = this.students.filter((item) => {
      return (item.toLowerCase().indexOf(text.toLowerCase()) > -1);
    })
  }

  signout() {
    this.a.signout()
  }

  async getUser(user1) {
    console.log(user1)
    let user = await this.a.getUserFromName(user1)

    let modal = this.modalCtrl.create(AnauserPage, {user: user.user})
    modal.present()
  }

  async getCSV() {
    let string = await this.a.getCSVTeacher()

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.hidden = true

    let blob = new Blob([string], {type: 'text/csv'})
    let url = window.URL.createObjectURL(blob)
    a.href = url;
    a.download = 'DigitrExport-' + Date.now() + '.csv'
    a.click()
  }

}
