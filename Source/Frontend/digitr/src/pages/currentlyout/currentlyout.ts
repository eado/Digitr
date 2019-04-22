import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the CurrentlyoutPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-currentlyout',
  templateUrl: 'currentlyout.html',
})
export class CurrentlyoutPage {

  list = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public vc: ViewController) {
    this.list = navParams.get('list')
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CurrentlyoutPage');
  }

  user(name) {
    this.vc.dismiss(name)
  }

  done() {
    this.vc.dismiss()
  }

}
