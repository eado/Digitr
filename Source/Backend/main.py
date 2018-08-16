#!${BACKEND}venv/bin/python3

import json
import logging
import sys
import os

from threading import Thread

from websocket_server import WebsocketServer
 
from responder import Responder, clients

from pymongo import MongoClient

mongo_client = MongoClient()

def message_received(client, server, message):
    try:
        def start_responder(client, server, message, mongo_client):
            Responder(client, server, message, mongo_client)

        p = Thread(target=start_responder, args=(client, server, message, mongo_client))
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

if __name__ == '__main__':
    os.system("tput setaf 3")
    try: 
        start_server()
    except KeyboardInterrupt:
        os.system("tput setaf 7")
        logging.warn("Shutting down")
        os.system("killall mongod")
        sys.exit(0)
    except ValueError:
        pass
