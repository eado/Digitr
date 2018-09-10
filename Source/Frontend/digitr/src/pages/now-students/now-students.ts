declare var require: any;
var ProgressBar = require('progressbar.js')

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ToastController, AlertController, Platform } from 'ionic-angular';
import { AuthService } from '../../auth.service';
import { ServerconnService } from '../../serverconn.service';
import { TeachersPage } from '../teachers/teachers';
import { TimerPage } from '../timer/timer';
import { Push, PushOptions } from '@ionic-native/push'

/**
 * Generated class for the NowStudentsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-now-students',
  templateUrl: 'now-students.html',
})

export class NowStudentsPage {
  first = true;

  currentPage = "now"
  
  user;
  messagesDisplayed = [];
  districtInfo;

  passesRemaining;
  totalPasses = 0;
  history: any[] = []
  teachers: string[]
  teachersWithNames: [string, string][]

  dest = 'Restroom'
  teacher;

  circle;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public modalCtrl: ModalController, private scs: ServerconnService, public toastCtrl: ToastController, public alertCtrl: AlertController, public push: Push, public plt: Platform) {
  }

  async ionViewDidLoad() {
    this.circle = new ProgressBar.Circle('#passCircle', {
      color: '#EC6C4D',
      strokeWidth: 5,
      trailWidth: 5
    })
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

    console.log('ionViewDidLoad NowStudentsPage');
    this.a.getUser(localStorage.getItem('email'), (user) => {
      if (user.messages && this.first) {
        for (let message of user.messages) {
          this.messagesDisplayed.push(message.timestamp)
        }
      }
      if (!this.first && user.messages) {
        user.messages = (user.messages as any[]).reverse()

        for (let message of user.messages) {
          if (this.messagesDisplayed.indexOf(message.timestamp) < 0) {
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
            this.messagesDisplayed.push(message.timestamp)
          }
        }
      }
      this.user = user;
      this.a.getDistrictInfo().then((dist) => {
        this.districtInfo = dist
        if (this.user.history) {
          this.history = this.user.history;
        }
        let usedPasses: any[] = []
    
        for (let pass of this.history) {
          if (pass.name != 'Free') {
            usedPasses.push(pass)
          }
        }
        this.totalPasses = this.districtInfo.pass
        this.passesRemaining = this.totalPasses - usedPasses.length
        this.teachers = this.districtInfo.teachers
        this.teachersWithNames = this.districtInfo.teachers_with_names
        this.circle.animate(this.passesRemaining / this.totalPasses)
      })
      this.first = false;
    })
  }

  changed(seg) {
    console.log(seg)
  }

  tts(timestamp): string {
    let date = new Date(timestamp * 1000);
  
    return date.toLocaleString('en-US')
  }

  pickTeacher() {
    let modal = this.modalCtrl.create(TeachersPage, {teachers: this.teachersWithNames})

    modal.onDidDismiss((() => {
      this.teacher = localStorage.getItem('teacher')
    }))

    modal.present({

    })
  }

  async usepass() {
    let teacherEmail: string;
    for (let teach of this.teachersWithNames) {
      if (teach[1] == this.teacher) {
        teacherEmail = teach[0]
      }
    }
    await this.a.request_pass(teacherEmail, this.dest);
    let alert = this.toastCtrl.create({
      message: "Your pass request was sent to " + this.teacher + ".",
      showCloseButton: true
    })
    alert.present();

  }

  dismiss(message: number) {
    this.a.dismissMessage(message)
  }

  viewTimer(message) {
    let modal = this.modalCtrl.create(TimerPage, {minutes: message.minutes, timestamp: message.timestamp})
    modal.present()
  }

  async back(message: number, email: string) {
    await this.a.back_from_pass(message, email)
    this.dismiss(message)
    for (let nmessage of this.user.messages) {
      if (nmessage.type == "pass_approved" || nmessage.type == "pass_done") {
        this.dismiss(nmessage.timestamp)
      }
    }
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

  signout() {
    this.a.signout()
  }

}
