declare var require: any;
var ProgressBar = require('progressbar.js')

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

  circle;

  timestamp;

  constructor(public navCtrl: NavController, public navParams: NavParams) {

    this.timestamp = Math.floor(navParams.get('timestamp'))
    this.totalSeconds = +navParams.get('minutes') * 60
    console.log(this.timestamp)
    console.log(this.totalSeconds)
    this.seconds = Math.floor(Date.now() / 1000) - this.timestamp
    setInterval(() => {
      this.seconds = Math.floor(Date.now() / 1000) - this.timestamp
      this.circle.animate(this.seconds/this.totalSeconds)
    }, 1000)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TimerPage');
    this.circle = new ProgressBar.Circle('#timer', {
      color: '#EC6C4D',
      strokeWidth: 5,
      trailWidth: 5
    })
    this.circle.animate(this.seconds/this.totalSeconds)

  }

  done() {
    this.navCtrl.pop()
  }

}
