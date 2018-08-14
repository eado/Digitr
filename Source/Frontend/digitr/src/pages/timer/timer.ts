import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the TimerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-timer',
  templateUrl: 'timer.html',
})
export class TimerPage {
  totalSeconds = 0;
  seconds = 0;

  timestamp;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.timestamp = Math.floor(navParams.get('timestamp'))
    this.totalSeconds = +navParams.get('minutes') * 60
    console.log(this.timestamp)
    console.log(this.totalSeconds)
    this.seconds = Math.floor(Date.now() / 1000) - this.timestamp
    setInterval(() => {
      this.seconds = Math.floor(Date.now() / 1000) - this.timestamp
    }, 1000)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TimerPage');
  }

  done() {
    this.navCtrl.pop()
  }

}
