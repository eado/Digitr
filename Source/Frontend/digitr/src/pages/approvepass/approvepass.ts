import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
 
/**
 * Generated class for the ApprovepassPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-approvepass',
  templateUrl: 'approvepass.html',
})
export class ApprovepassPage {
  minutes = 5;
  name;
  passes;
  dest;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    let message = navParams.get('message');
    this.name = message.user
    this.passes = message.pass
    this.dest = message.destination
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ApprovepassPage');
  }

  approve(give = false) {
    this.viewCtrl.dismiss({give: give, minutes: this.minutes})
  }

  cancel() {
    this.viewCtrl.dismiss()
  }

}
