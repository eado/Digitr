import { Injectable } from "@angular/core";
import { ToastController } from "../node_modules/ionic-angular";
import { checkAndUpdateBinding } from "../node_modules/@angular/core/src/view/util";

const URL = "wss://home.omarelamri.me:9001";

@Injectable()
export class ServerconnService {
    
    private _ws: WebSocket
    private _callbacks: [String, (data: any) => void][] = []
    private _caches: String[] = []

    openCallbacks = [() => {}]

    constructor() {
        this._initialize()
    }

    private _check() {
        if (!this._ws || this._ws.readyState == 3) {
            this._initialize()
        }
    }

    private _initialize() {
        this._ws = new WebSocket(URL);

        this._ws.onmessage = (e) => {
            let data = JSON.parse(e.data);
            this._callbacks.forEach(
                callback => {

                    if (data.response_id === callback[0]) {
                        callback[1](data);
                    }
                }
            );
        }
        this._ws.onerror = (e) => {
            this._check()
        }

        this._ws.onclose = (e) => {
            this._check()
        }

        this._ws.onopen = (e) => {
            for (let callback of this.openCallbacks) {
                callback()
            }
            this._caches.forEach(element => {
                this._ws.send(element as string);
            });
        }
    }

    add(data: any, callback: ((any) => void)) {
        let identifier = this._generateIdentifier();
        data.request_id = identifier;
        if (localStorage.getItem('microsoft')) {
            data.ms = true;
        }
        this._callbacks.push([identifier, callback]);
        if (this._ws.readyState == this._ws.OPEN) {
            this._ws.send(JSON.stringify(data));
        } else {
            this._caches.push(JSON.stringify(data));
        }
    }

    private _generateIdentifier() {
        return uuidv4()
    }
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
