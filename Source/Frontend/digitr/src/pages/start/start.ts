import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController } from 'ionic-angular';
import { AuthService } from '../../auth.service';
import { EulaPage } from '../eula/eula';

/**
 * Generated class for the StartPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-start',
  templateUrl: 'start.html',
})
export class StartPage {
  studentClicked = false;
  teacherClicked = false;
  
  districtExists = true;
  schools: string[] = [];
  domain;

  agreed = false;

  domains = [];

  school;

  pass = 0;

  teachers_enabled = true;

  constructor(public navCtrl: NavController, public navParams: NavParams, private a: AuthService, public modalCtrl: ModalController, public alertCtrl: AlertController) {
    this.domain = localStorage.getItem('email').split('@')[1];
    this.domains.push(this.domain);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad StartPage');
  }

  logout() {
    gapi.auth2.getAuthInstance().disconnect();
    console.log('logged out');
  }

  student() {
    this.studentClicked = true;
    this.teacherClicked = false;
    this.getDistrict();
  }

  async getDistrict() {
    let val = await this.a.getDistrictAndSchools();
    this.districtExists = val[0];
    this.schools = val[1];
    if (val['2'] == false) {
      this.teachers_enabled = false;
    }
  }

  async teacher() {
    this.teacherClicked = true;
    this.studentClicked = false;
    await this.getDistrict();

    if (this.schools) {
      this.school = this.schools[0]
    }
  }

  setup() {
    let modal = this.modalCtrl.create(EulaPage);
    modal.onDidDismiss(
      () => {
        this.continueSetup();
      }
    )
    modal.present();
  }

  continueSetup() {
    this.agreed = true;
  }

  addSchool(school: string) {
    if (this.schools) {
      this.schools.push(school);
    } else {
      this.schools = [school];
    }
    this.school = school;
  }

  async completeSetup() {
    if (this.domains.length > 0 && this.pass > 0 && this.domains.indexOf(this.domain) > -1) {
      await this.a.addDistrict(this.domains, this.pass, this.schools);
      await this.a.addUser(true, this.school);

      this.finishAlert();
    } else {
      let alert = this.alertCtrl.create({
        title: "There was an error creating your district.",
        subTitle: "Please make sure of the following: The number of passes is above 0, and you are signed in to one of the domains above.",
        buttons: ['Dismiss']
      })
      alert.present();
    }
  }

  private finishAlert() {
    let alert = this.alertCtrl.create({
      title: "Success!",
      subTitle: "Thank you for signing up with Digitr!",
      message: "Remember, you can get help at digitrapp.com.",
      buttons: ['Continue to app']
    });
    alert.onDidDismiss(() => {
      window.location.reload(false);
    });

    alert.present()
  }

  async addTeacher() {
    await this.a.addUser(true, this.school);

    this.finishAlert()
  }
  async addStudent() {
    await this.a.addUser(false);

    this.finishAlert()
  }
}
