import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, Alert, ModalController, LoadingController } from 'ionic-angular';
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

function getParameterByName(name, url?) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

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

  isAdmin = false;
  viewAsAdmin = false;

  payment;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public alertCtrl: AlertController, 
    public modalCtrl: ModalController, public toastCtrl: ToastController, public push: Push, 
    public loadingCtrl: LoadingController) {
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
      if (this.dist.admins.indexOf(localStorage.getItem('email')) > -1) {
        this.isAdmin = true;
        console.log(true)
        this.a.getPaymentStats().then(st => {
          this.payment = st;
        })

        if (getParameterByName('paymentId')) {
          let loading = this.loadingCtrl.create()
          loading.present()
          this.a.execute_payment(getParameterByName('paymentId'), getParameterByName('PayerID')).then(() => {
            let alert = this.alertCtrl.create({
              title: "Success!",
              subTitle: "Your payment was received.",
              buttons: ['Dismiss']
            })
            alert.present()
            loading.dismiss()
          }).catch(() => {
            let alert = this.alertCtrl.create({
              title: "Error",
              subTitle: "There was an error processing your payment. Please try again. (No charges were made.)",
              buttons: ['Dismiss']
            })
            alert.present()
            loading.dismiss()
          })
        }
      }
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
    let string;
    if (this.viewAsAdmin) {
      string = await this.a.getCSVAdmin()
    } else {
      string = await this.a.getCSVTeacher()
    }

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.hidden = true

    let blob = new Blob([string], {type: 'text/csv'})
    let url = window.URL.createObjectURL(blob)
    a.href = url;
    a.download = 'DigitrExport-' + Date.now() + '.csv'
    a.click()
  }

  async toggleAdmin() {
    if (this.viewAsAdmin) {
      this.stats = await this.a.getTeacherStats()
      this.students = await this.a.getTeacherUsers()
      this.filteredStudents = this.students
      this.viewAsAdmin = false;
    } else {
      this.stats = await this.a.getAdminStats()
      this.students = await this.a.getAdminUsers()
      this.filteredStudents = this.students
      this.viewAsAdmin = true
    }
  }

  sendToAll() {
    let alert = this.alertCtrl.create({
      title: "Send Message to all",
      inputs : [
        {
          name: 'message',
          placeholder: 'Message'
        }
      ],
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Send',
          handler: data => {
            this.a.sendMessageToAll(data.message).then(() => {
              let toast = this.toastCtrl.create({
                message: "Message was sent.",
                showCloseButton: true
              })
              toast.present()
            })
          }
        }
      ]
    })
    alert.present()
  }

  async edit(event, field: string, data: string, type?: string) {
    await this.a.editDistrict(field, data, type)
    event.target.value = ""
    this.dist = await this.a.getDistrictInfo()
    let toast = this.toastCtrl.create({
      message: "Updated district.",
      showCloseButton: true
    })
    toast.present()
  }

  async reset() {
    let alert = this.alertCtrl.create({
      title: "Are you sure you would like to reset the passes?",
      subTitle: "This is an irrevocable request.",
      buttons: [
        {
          text: "Yes",
          cssClass: "danger",
          handler: () => {
            this.a.reset_passes().then(() => {
              let toast = this.toastCtrl.create({
                message: "Passes reset.",
                showCloseButton: true
              })
              toast.present()
            })
          }
        },
        {
          text: "No",
          role: "cancel"
        }
      ]
    })
    alert.present()
  }

  async startFresh() {
    let alert = this.alertCtrl.create({
      title: "Are you sure you would like to remove all users?",
      subTitle: "This is an irrevocable request. All users will have to signin again.",
      buttons: [
        {
          text: "Yes",
          cssClass: "danger",
          handler: () => {
            this.a.start_fresh().then(() => {
              let toast = this.toastCtrl.create({
                message: "Users removed.",
                showCloseButton: true
              })
              toast.present()
            })
          }
        },
        {
          text: "No",
          role: "cancel"
        }
      ]
    })
    alert.present()
  }

  startPayment() {
    let loading = this.loadingCtrl.create()
    loading.present()
    this.a.start_payment().then(url => {
      window.location.href = url;
    }).catch(() => {
      let alert = this.alertCtrl.create({
        title: "Error",
        subTitle: "There was an error processing your payment. Please try again. (No charges were made.)",
        buttons: ['Dismiss']
      })
      alert.present()
    })
  }
}
