import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the MessagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-message',
  templateUrl: 'message.html',
})
export class MessagePage {

  name;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    this.name = navParams.get("name")
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MessagePage');
  }

  cancel() {
    this.navCtrl.pop()
  }

  send(text) {
    this.viewCtrl.dismiss({'text': text})
  }

}
