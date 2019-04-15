import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, Alert, ModalController, LoadingController, Platform, MenuController } from 'ionic-angular';
import { ServerconnService } from '../../serverconn.service';
import { AuthService } from '../../auth.service';
import { ApprovepassPage } from '../approvepass/approvepass';
import { PushOptions, Push } from '@ionic-native/push';
import { AnauserPage } from '../anauser/anauser';
import { MessagePage } from '../message/message';
import { MyApp } from '../../app/app.component';
import { WhatsnewPage } from '../whatsnew/whatsnew';

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

  messagesDisplayed = [];

  currentPage = "messages"
  analyticsPage = "stats"
  searchseg = "students"

  dist;
  analytics;

  students;
  filteredStudents;
  stats;

  isAdmin = false;
  viewAsAdmin = false;
  all = false;

  payment;

  avail;

  local_version = MyApp.LOCAL_VERSION;

  mvpenabled;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public alertCtrl: AlertController, 
    public modalCtrl: ModalController, public toastCtrl: ToastController, public push: Push, 
    public loadingCtrl: LoadingController, public plt: Platform, public menu: MenuController) {
      this.avail = !plt.is("cordova");
      this.mvpenabled = localStorage.getItem("mvpenabled") == "true"
  }

  ionViewDidLoad() {

    if (localStorage.getItem("latestVersion") != this.local_version) {
      let modal = this.modalCtrl.create(WhatsnewPage);
      modal.present();
    }

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
            if (message.type == "pass_done") {
              this.playSound()
            }
            this.messagesDisplayed.push(message.timestamp)
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
              buttons: ['Reload app']
            })
            alert.onDidDismiss(() => {
              location.href = location.href.split("?")[0]
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

  async setAll() {
    this.all = !this.all;
    this.getAnalytics();  
  }

  async getAnalytics(event=null) {
    if (this.searchseg == "teachers") {
      let teachers = [];
      this.dist.teachers_with_names.forEach(element => {
        teachers.push(element[1])
      });
      this.students = teachers;
      this.filteredStudents = this.students;
      return
    }
    if (this.viewAsAdmin) {
      this.stats = await this.a.getAdminStats()
      this.students = await this.a.getAdminUsers()
    } else {
      this.stats = await this.a.getTeacherStats(this.all)
      this.students = await this.a.getTeacherUsers()
    }
    this.filteredStudents = this.students

    if (event) {
      event.complete()
    }
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
            showCloseButton: true,
            duration: 3000
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

    let modal = this.modalCtrl.create(AnauserPage, {user: user.user, isAdmin: this.isAdmin})
    modal.present()
  }

  async getCSV() {
    let loading = this.loadingCtrl.create({content: "Loading csv data...", enableBackdropDismiss: true});
    loading.present();
    let string;
    if (this.viewAsAdmin) {
      string = await this.a.getCSVAdmin()
    } else {
      string = await this.a.getCSVTeacher()
    }

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.hidden = true

    loading.dismiss();
    let blob = new Blob([string], {type: 'text/csv'})
    let url = window.URL.createObjectURL(blob)
    a.href = url;
    a.download = 'DigitrExport-' + Date.now() + '.csv'
    a.click()
  }

  async toggleAdmin() {
    let loading = this.loadingCtrl.create({content: "Loading teacher/admin data...", enableBackdropDismiss: true});
    loading.present();
    if (this.viewAsAdmin) {
      this.stats = await this.a.getTeacherStats(this.all)
      this.students = await this.a.getTeacherUsers()
      this.filteredStudents = this.students
      this.viewAsAdmin = false;
    } else {
      this.stats = await this.a.getAdminStats()
      this.students = await this.a.getAdminUsers()
      this.filteredStudents = this.students
      this.viewAsAdmin = true
    }
    loading.dismiss();
  }

  sendToAll() {
    let modal = this.modalCtrl.create(MessagePage, {name: "all"});
    modal.onDidDismiss((value => {
      if (value) {
        this.a.sendMessageToAll(value.text).then(() => {
          let toast = this.toastCtrl.create({
            message: "Message was sent.",
            showCloseButton: true,
            duration: 3000
          })
          toast.present()
        })
      }
    }))
    modal.present()
  }

  async edit(event, field: string, data: string, type?: string) {
    await this.a.editDistrict(field, data, type)
    event.target.value = ""
    this.dist = await this.a.getDistrictInfo()
    let toast = this.toastCtrl.create({
      message: "Updated district.",
      showCloseButton: true,
      duration: 3000
    })
    toast.present()
  }

  mvptoggle() {
    if (this.mvpenabled) {
      this.mvpenabled = false;
      localStorage.setItem("mvpenabled", "false")
    } else {
      this.mvpenabled = true;
      localStorage.setItem("mvpenabled", "true")
    }
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
                showCloseButton: true,
                duration: 3000
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
                showCloseButton: true,
                duration: 3000
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

  async startTrial() {
    await this.a.start_trial()
    let alert = this.alertCtrl.create({
      title: "Success!",
      subTitle: "Your trial period has started.",
      buttons: ["Reload app"]
    })
    alert.onDidDismiss(() => {
      location.href = location.href.split("?")[0]
    })
    alert.present()
  }

  async clearMessages() {
    await this.a.clear_messages()
  }

  async sendBack() {
    await this.a.send_everyone_back()

    let alert = this.alertCtrl.create({
      title: "All outstanding students are marked as back.",
      buttons: ["Dismiss"]
    })

    alert.present(); 
  }

  duration(timestamp: number, days: number) {
    let interval = Math.floor(Date.now() / 1000) - timestamp
    return days - Math.floor(interval / 86400)
  }

  openMenu() {
    this.menu.open()
  }

  getCurrentPage(): String {
    return this.currentPage.charAt(0).toUpperCase() + this.currentPage.slice(1);
  }
}
