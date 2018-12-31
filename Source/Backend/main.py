#!${BACKEND}/venv/bin/python3

import json
import sys
import os
import datetime

from multiprocessing import Process

from websocket_server import WebsocketServer
 
from responder import Responder, clients

from pymongo import MongoClient

from time import sleep


def message_received(client, server, message):
    try:
        def start_responder(client, server, message):
            Responder(client, server, message)

        p = Process(target=start_responder, args=(client, server, message))
        p.start()
    except json.JSONDecodeError as e:
        server.send_message(client, 'Invalid request. {}'.format(e))
    except KeyError as e:
        server.send_message(client, 'Invalid request. {}'.format(e))

def client_left(client1, server):
    if client1 in clients:
        clients.remove(client1)

def start_server():
    server = WebsocketServer(9001, host='0.0.0.0')
    server.set_fn_message_received(message_received)
    server.set_fn_client_left(client_left)
    server.run_forever()

def start_payment_service():
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


if __name__ == '__main__':
    os.system("tput setaf 3")
    try:
        p = Process(target=start_payment_service)
        p.start()
        start_server()
    except KeyboardInterrupt:
        os.system("tput setaf 7")
        os.system("killall mongod")
        sys.exit(0)
    except ValueError:
        pass 
