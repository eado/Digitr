import { Injectable } from "../node_modules/@angular/core";
import { ServerconnService } from "./serverconn.service";
import { resolveDefinition } from "../node_modules/@angular/core/src/view/util";
import { ValueTransformer } from "../node_modules/@angular/compiler/src/util";
import { Platform } from "../node_modules/ionic-angular";
import { GooglePlus } from "../node_modules/@ionic-native/google-plus";

export function capitalizeName(name) {
    return name.replace(/\b(\w)/g, s => s.toUpperCase());
}

declare var Msal: any;

@Injectable()
export class AuthService {
    constructor(private scs: ServerconnService, public plt: Platform, public googlePlus: GooglePlus) {
        this.msInitialize()
    }

    user: any;

    msApp;

    msLoginCallback = null

    msInitialize() {
        this.msApp = new Msal.UserAgentApplication("297fd33d-f3f1-44b8-babd-a7c39a049b4a", null, this.msCallback, {
            redirectUri: location.origin
        });
    }

    msCallback() {
        this.msApp = new Msal.UserAgentApplication("297fd33d-f3f1-44b8-babd-a7c39a049b4a", null, this.msCallback, {
            redirectUri: location.origin
        });

        this.msApp.acquireTokenSilent(["https://graph.microsoft.com/user.read"]).then((token) => {
            if (!token) {
                this.msApp.acquireTokenRedirect(["https://graph.microsoft.com/user.read"])
            } else {
                localStorage.setItem('microsoft', token)
                
                let once = false
                setInterval(() => {
                    if (this.msLoginCallback && !once) {
                        once = true;
                        this.msLoginCallback()
                    }
                }, 1000)
            }
        })
    }

    msLogin() {
        this.msApp.loginRedirect(["https://graph.microsoft.com/user.read"])
    }

    getToken(): string {
        if (localStorage.getItem("microsoft")) {
            return localStorage.getItem('microsoft')
        }
        if (this.plt.is('cordova')) {
            return this.user.idToken
        } else {
            return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
        }
    }

    async getMsData(): Promise<any> {
        return new Promise<[boolean, boolean]>((r, rej) => {
            this.scs.add({request: 'get_ms_data', token: this.getToken()}, (value) => {
                r(value)
            });
        });
    }

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

    async getDistrictAndSchools(): Promise<[boolean, string[], boolean]> {
        let domain = localStorage.getItem('email').split('@')[1];

        return new Promise<[boolean, string[], boolean]>((resolve, _) => {
            this.scs.add({request: 'get_district', domain: domain}, (value) => {
                let t_e = true;
                if (value.teachers_enabled == false) {
                    t_e = false;
                }
                resolve([value.exists, value.schools, t_e])
            });
        })
    }

    async addUser(isTeacher: boolean, school?: string): Promise<void> {
        let name;

        if (this.plt.is('cordova')) {
            name = capitalizeName(this.user.displayName)
        } else if (localStorage.getItem('microsoft')) {
            name = localStorage.getItem('name')
        } else {
            name = capitalizeName(gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getName().toLowerCase())
        }
        
        return new Promise<void>((resolve, reject) => {
            this.scs.add({request: "add_user", is_teacher: isTeacher, school: school, email: localStorage.getItem('email'), token: this.getToken(), name: name}, (value) => {
                if (value.success) {
                    resolve()
                } else {
                    reject()
                }
            });
        })
    }

    async addDistrict(domains: string[], pass: number, schools?: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.scs.add({request: "add_district", domains: domains, schools: schools, email: localStorage.getItem('email'), token: this.getToken(), pass: pass}, (value) => {
                if (value.success) {
                    resolve()
                } else {
                    reject()
                }
            });
        })
    }

    async getUser(user: string, callback: ((any) => void)) {
        this.scs.add({request: "get_user", email: localStorage.getItem('email'), token: this.getToken(), user: user}, (value) => {
            callback(value.user)
        })
        this.scs.openCallbacks.push(() => {
            this.scs.add({request: "get_user", email: localStorage.getItem('email'), token: this.getToken(), user: user}, (value) => {
                callback(value.user)
            })
        })
    }

    async getDistrictInfo(): Promise<any> {
        let domain = localStorage.getItem('email').split('@')[1];

        return new Promise<any>((resolve, _) => {
            this.scs.add({request: "get_district_info", domain: domain, token: this.getToken(), email: localStorage.getItem('email')}, resolve);
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
        return new Promise<void>((resolve, _) => {
            this.scs.add({request: "request_pass", email: localStorage.getItem("email"), user: teacherEmail, token: this.getToken(), dest: dest}, (value) => {
                resolve()
            })
        })
    }

    async denyPass(messageTime: number, user: string) {
        return new Promise<void>((r, _) => {
            this.scs.add({request: "deny_pass", user: user, token: this.getToken(), email: localStorage.getItem('email'), message_time: messageTime}, () => {
                r()
            })
        })
    }

    async dismissMessage(messageTime: number) {
        return new Promise<void>((r, _) => {
            this.scs.add({request: "deny_pass", token: this.getToken(), email: localStorage.getItem('email'), message_time: messageTime}, () => {
                r()
            })
        })
    }

    async approvePass(free: boolean, destination: string, minutes: number, user: string) {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "approve_pass",
                token: this.getToken(),
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
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "back_from_pass",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                timestamp: timestamp,
                teacher: teacher
            }, () => {
                r()
            })
        })
    }

    async setNotification(id: string) {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "set_notification",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                id: id,
                ios: this.plt.is('cordova')
            }, () => {
                r()
            })
        })
    }

    async getTeacherStats(): Promise<any> {
        return new Promise<any>((r, _) => {
            this.scs.add({
                request: "get_teacher_stats",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value)
            })
        })
    }

    async getTeacherUsers(): Promise<string[]> {
        return new Promise<string[]>((r, _) => {
            this.scs.add({
                request: "get_teacher_users",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value.users)
            })
        })
    }

    async getUserFromName(name: string): Promise<any> {
        return new Promise<any>((r, _) => {
            this.scs.add({
                request: "get_user_from_name",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                user: name
            }, value => {
                r(value)
            })
        })
    }

    async sendMessage(user: string, message: string): Promise<void> {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "send_custom_message",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                user: user,
                message: message
            }, value => {
                r()
            })
        })
    }

    async sendMessageToAll(message: string): Promise<void> {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "send_to_all",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                message: message
            }, value => {
                r()
            })
        })
    }

    async getCSVTeacher(): Promise<string> {
        return new Promise<string>((r, _) => {
            this.scs.add({
                request: "get_csv_for_teacher",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value.csv_data)
            })
        })
    }

    async getAdminStats(): Promise<any> {
        return new Promise<any>((r, _) => {
            this.scs.add({
                request: "get_admin_stats",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value)
            })
        })
    }

    async getPaymentStats(): Promise<any> {
        return new Promise<any>((r, _) => {
            this.scs.add({
                request: "get_payment_stats",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value)
            })
        })
    }

    async getAdminUsers(): Promise<string[]> {
        return new Promise<string[]>((r, _) => {
            this.scs.add({
                request: "get_admin_users",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value.users)
            })
        })
    }

    async getCSVAdmin(): Promise<string> {
        return new Promise<string>((r, _) => {
            this.scs.add({
                request: "get_csv_for_admin",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r(value.csv_data)
            })
        })
    }

    async editDistrict(field: string, data: string, type?: string): Promise<void> {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "edit_district",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                field: field,
                data: data,
                type: type
            }, value => {
                r()
            })
        })
    }

    async reset_passes() {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "reset_passes",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r()
            })
        })
    }

    async start_fresh() {
        return new Promise<void>((r, _) => {
            this.scs.add({
                request: "start_fresh",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                r()
            })
        })
    }

    async start_payment(): Promise<string> {
        return new Promise<string>((r, rej) => {
            this.scs.add({
                request: "start_payment",
                token: this.getToken(),
                email: localStorage.getItem('email'),
            }, value => {
                if (value.error) {
                    rej()
                } else {
                    r(value.url)
                }
            })
        })
    }

    async execute_payment(paymentId: string, payerId: string): Promise<string> {
        return new Promise<string>((r, rej) => {
            this.scs.add({
                request: "execute_payment",
                token: this.getToken(),
                email: localStorage.getItem('email'),
                payment_id: paymentId,
                payer_id: payerId
            }, value => {
                if (value.error) {
                    rej()
                } else {
                    r()
                }
            })
        })
    }

    async start_trial() {
        return new Promise<string>((r, rej) => {
            this.scs.add({
                request: "start_trial",
                token: this.getToken(),
                email: localStorage.getItem('email')
            }, value => {
                if (value.error) {
                    rej()
                } else {
                    r()
                }
            })
        })
    }

    async send_everyone_back() {
        return new Promise<string>((r, rej) => {
            this.scs.add({
                request: "send_everyone_back",
                token: this.getToken(),
                email: localStorage.getItem('email')
            }, value => {
                if (value.error) {
                    rej()
                } else {
                    r()
                }
            })
        })
    }

    async clear_messages() {
        return new Promise<string>((r, rej) => {
            this.scs.add({
                request: "clear_messages", 
                token: this.getToken(),
                email: localStorage.getItem('email')
            }, value => {
                if (value.error) {
                    rej()
                } else {
                    r()
                }
            })
        })
    }


    signout() {
        if (localStorage.getItem('microsoft')) {
            localStorage.setItem('microsoft', "")
            localStorage.setItem('signedIn', "false")
            location = location
            return
        }
        if (this.plt.is('cordova')) {
            this.googlePlus.logout()
            location = location
        }
        gapi.auth2.getAuthInstance().signOut()
        localStorage.setItem('signedIn', "false")
        location = location
    }
}