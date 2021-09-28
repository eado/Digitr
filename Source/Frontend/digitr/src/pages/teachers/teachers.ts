import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the TeachersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-teachers',
  templateUrl: 'teachers.html',
})
export class TeachersPage {

  teachers: string[]

  filteredTeachers: string[]

  teacher: string

  frequentTeachers: string[] = []

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    let teachersString = localStorage.getItem('teachers')
    let parsed = JSON.parse(teachersString)
    if (parsed) {
      this.frequentTeachers = parsed;
    }

    let teachersArray: [string, string][] = this.navParams.get('teachers')
    teachersArray.sort((a, b) => a[1].localeCompare(b[1]))
    let teach: string[] = []
    for (let teacher of teachersArray) {
      teach.push(teacher[1])
    }

    this.teachers = teach;
    this.filteredTeachers = teach;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SchoolsPage');
  }

  filterTeachers(keyword: string) {
    this.filteredTeachers = [];
    this.teachers.forEach(element => {
      if (element.toLowerCase().indexOf(keyword.toLowerCase()) >= 0) {
        this.filteredTeachers.push(element)
      }
    });
  }

  done() {
    if (this.teacher) {
      localStorage.setItem('teacher', this.teacher);
      if (this.frequentTeachers.indexOf(this.teacher) < 0)
      this.frequentTeachers.push(this.teacher)
      localStorage.setItem('teachers', JSON.stringify(this.frequentTeachers))
    }
    this.navCtrl.pop()
  }

}
