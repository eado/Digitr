import { Injectable } from "../node_modules/@angular/core";
import { ServerconnService } from "./serverconn.service";
import { resolveDefinition } from "../node_modules/@angular/core/src/view/util";
import { ValueTransformer } from "../node_modules/@angular/compiler/src/util";
import { Platform } from "../node_modules/ionic-angular";
import { GooglePlus } from "../node_modules/@ionic-native/google-plus";

export function capitalizeName(name) {
    return name.replace(/\b(\w)/g, s => s.toUpperCase());
}

@Injectable()
export class AuthService {
    constructor(private scs: ServerconnService, public plt: Platform, public googlePlus: GooglePlus) {}

    user: any;

    async serverSignin(token: string): Promise<[boolean, boolean]> {

        return new Promise<[boolean, boolean]>((resolve, _) => {
            this.scs.add({request: 'signin', token: token}, (value) => {
                let val: [boolean, boolean];
                if (!value.success) {
                    val = [false, false];
                } else {
                    val = [true, value.user_exists];
                }
                resolve(val)
            });
        });
    }

    async userExists(email: string): Promise<[boolean, boolean]> {
        return new Promise<[boolean, boolean]>((resolve, _) => {
            this.scs.add({request: "user_exists", email: email}, (value) => {
                let val: [boolean, boolean] = [value.user_exists, value.is_teacher]
                resolve(val)
            })
        })
    }

    async getDistrictAndSchools(): Promise<[boolean, string[]]> {
        let domain = localStorage.getItem('email').split('@')[1];

        return new Promise<[boolean, string[]]>((resolve, _) => {
            this.scs.add({request: 'get_district', domain: domain}, (value) => {
                resolve([value.exists, value.schools])
            });
        })
    }

    async addUser(isTeacher: boolean, school?: string): Promise<void> {
        let name;
        let token;

        if (this.plt.is('cordova')) {
            name = capitalizeName(this.user.displayName)
            token = this.user.idToken
        } else {
            name = capitalizeName(gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getName().toLowerCase())
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
        }
        
        return new Promise<void>((resolve, reject) => {
            this.scs.add({request: "add_user", is_teacher: isTeacher, school: school, email: localStorage.getItem('email'), token: token, name: name}, (value) => {
                if (value.success) {
                    resolve()
                } else {
                    reject()
                }
            });
        })
    }

    async addDistrict(domains: string[], pass: number, schools?: string[]): Promise<void> {
        let token;
        if (this.plt.is('cordova')) {
            token = this.user.idToken
        } else {
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
        }
        
        return new Promise<void>((resolve, reject) => {
            this.scs.add({request: "add_district", domains: domains, schools: schools, email: localStorage.getItem('email'), token: token, pass: pass}, (value) => {
                if (value.success) {
                    resolve()
                } else {
                    reject()
                }
            });
        })
    }

    async getUser(user: string, callback: ((any) => void)) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        this.scs.add({request: "get_user", email: localStorage.getItem('email'), token: token, user: user}, (value) => {
            callback(value.user)
        })
        this.scs.openCallbacks.push(() => {
            this.scs.add({request: "get_user", email: localStorage.getItem('email'), token: token, user: user}, (value) => {
                callback(value.user)
            })
        })
    }

    async getDistrictInfo(): Promise<any> {
        let token;         
        if (this.plt.is('cordova')) {
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        let domain = localStorage.getItem('email').split('@')[1];

        return new Promise<any>((resolve, _) => {
            this.scs.add({request: "get_district_info", domain: domain, token: token, email: localStorage.getItem('email')}, resolve);
        })
    }

    // async listOfEmailsToNames(list: string[]): Promise<[string, string][]> {
    //     let token;         if (this.plt.is('cordova')) {             token = this.user.idToken         } else {             token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         }
    //     let list2: [string, string][] = [];
        
    //     for (let el of list) {
    //         let val = await this.scs.add({request: "get_name_for_user", user: el, token: token, email: localStorage.getItem('email')})
    //         list2.push([el, val.name])
    //     }

    //     return new Promise<[string, string][]>((r, _) => r(list2))
    // }

    async request_pass(teacherEmail: string, dest: string) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((resolve, _) => {
            this.scs.add({request: "request_pass", email: localStorage.getItem("email"), user: teacherEmail, token: token, dest: dest}, (value) => {
                resolve()
            })
        })
    }

    async denyPass(messageTime: number, user: string) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((r, _) => {
            this.scs.add({request: "deny_pass", user: user, token: token, email: localStorage.getItem('email'), message_time: messageTime}, () => {
                r()
            })
        })
    }

    async dismissMessage(messageTime: number) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((r, _) => {
            this.scs.add({request: "deny_pass", token: token, email: localStorage.getItem('email'), message_time: messageTime}, () => {
                r()
            })
        })
    }

    async approvePass(free: boolean, destination: string, minutes: number, user: string) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "approve_pass",
                token: token,
                email: localStorage.getItem('email'),
                user: user,
                destination: destination,
                free: free,
                minutes: minutes
            }, () => {
                r()
            })
        })
    }

    async back_from_pass(timestamp: number, teacher: string) {
        let token;         
        if (this.plt.is('cordova')) {             
            token = this.user.idToken         
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "back_from_pass",
                token: token,
                email: localStorage.getItem('email'),
                timestamp: timestamp,
                teacher: teacher
            }, () => {
                r()
            })
        })
    }

    async setNotification(id: string) {
        let token; 
        let ios = false;        
        if (this.plt.is('cordova')) {             
            token = this.user.idToken   
            ios = true      
        } else {             
            token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token         
        }
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "set_notification",
                token: token,
                email: localStorage.getItem('email'),
                id: id,
                ios: ios
            }, () => {
                r()
            })
        })
    }

    signout() {
        if (this.plt.is('cordova')) {
            this.googlePlus.logout()
            location = location
        }
        gapi.auth2.getAuthInstance().signOut()
        localStorage.setItem('signedIn', "false")
        location = location
    }
}