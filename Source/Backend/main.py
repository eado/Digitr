#!${BACKEND}/venv/bin/python3

import json
import sys
import os
import datetime
import logging

os.system("tput setaf 4")
print("Digitr Starting...")

from multiprocessing import Process
from threading import Thread

from websocket_server import WebsocketServer
 
from responder import Responder, clients

from pymongo import MongoClient

from time import sleep

logger = logging.getLogger("websocket_server")
logger.setLevel(logging.INFO)

fh = logging.FileHandler('spam.log')
fh.setLevel(logging.INFO)
logger.addHandler(fh)

def message_received(client, server, message):
    request = json.loads(message)
    def start_responder(client, server, message):
        try:
            Responder(client, server, request)
        except json.JSONDecodeError as e:
            server.send_message(client, 'Invalid request. {}'.format(e))
        except KeyError as e:
            server.send_message(client, 'Invalid request. {}'.format(e))

    p = Thread(target=start_responder, args=(client, server, message))
    p.daemon = True
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ", " + 
              p.name + ", " + 
              client['address'][0] + ", " + 
              request.get('request') if not None else "None" + ", " + 
              request.get('email') if not None else "None" + "\n")
    
    p.start()

def client_left(client1, server):
    if client1 in clients:
        clients.remove(client1)

def start_server():
    server = WebsocketServer(9001, host='0.0.0.0')
    server.set_fn_message_received(message_received)
    server.set_fn_client_left(client_left)
    print("Started\n")
    server.run_forever()

def start_payment_service():
    mongo_client = MongoClient(port=3232)
    db = mongo_client.digitr

    while True:
        districts = db.districts.find({})
        now = datetime.datetime.now().timestamp()

        for district in districts:
            if district.get('trial_start') and (not district.get('trial_finished')):
                days = (now - district['trial_start']) // 86400
                if days > 30:
                    db.districts.update({'domains': district['domains']}, {'$set': {'trial_finished': True}})
                    db.districts.update({'domains': district['domains']}, {'$set': {'analytics': False}})
            if district.get('analytics_start_timestamp'):
                days = (now - district['analytics_start_timestamp']) // 86400
                if days > 365:
                    db.districts.update({'domains': district['domains']}, {'$set': {'analytics': False}})
            if district.get('max_count'):
                count = db.users.count({'domain': {'$in': district['domains']}, 'is_teacher': False})
                if district['max_count'] < count:
                    db.districts.update({'domains': district['domains']}, {'$set': {'max_count': count}})
            else:
                count = db.users.count({'domain': {'$in': district['domains']}, 'is_teacher': False})
                db.districts.update({'domains': district['domains']}, {'$set': {'max_count': count}})
        
        sleep(3600)

def send_students_back():
    mongo_client = MongoClient(port=3232)
    db = mongo_client.digitr

    while True:
        users = db.users.find({})
        now = datetime.datetime.now().timestamp()

        for user in users:
            for hist in user['history']:
                if hist.get('timestamp_end'):
                    continue
                else:
                    if (now - hist['timestamp']) >= 86400:
                        hist['timestamp_end'] = hist['timestamp'] + 3600
                        db.users.update_one({'email': user['email'], 'history.timestamp': hist['timestamp']}, 
                                 {'$set': {'history.$.timestamp_end': hist['timestamp'] + 3600}})
    
        sleep(3600)


if __name__ == '__main__':
    try:
        p = Thread(target=start_payment_service)
        p.daemon = True
        p.start()

        p = Thread(target=send_students_back)
        p.daemon = True
        p.start()

        start_server()
        while True: sleep(100)
    except KeyboardInterrupt:
        print("\nExiting...")
        os.system("tput setaf 7")
        sys.exit(0)
