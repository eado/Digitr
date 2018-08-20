import datetime
import json
import uuid
import os
import sys

from google.auth.transport import requests
from google.oauth2 import id_token
from pymongo import MongoClient
from bson.json_util import dumps
from time import sleep
from apns import APNs, Payload

CLIENT_ID = "1089587494564-2ntl0ugt0d8e7cm8muclg0b81e5aj91h.apps.googleusercontent.com"
CLIENT_ID_2 = "1089587494564-63vl8kls1v7jc3qlgrmn087ponappo6q.apps.googleusercontent.com"
clients = []

nots_sent = []

class Responder:
    server = None
    client = None 
    request = None
    db = None

    def __init__(self, client, server, message, mongo_client):
        self.server = server
        self.client = client

        request = json.loads(message)
        self.request = request

        self.db = mongo_client.digitr

        if request['request'] == 'signin':
            self.signin()
        if request['request'] == 'user_exists':
            self.user_exists()
        if request['request'] == 'get_district':
            self.get_district()
        if request['request'] == 'add_district':
            self.add_district()
        if request['request'] == 'add_user':
            self.add_user()
        if request['request'] == 'get_user':
            self.get_user()
        if request['request'] == 'get_district_info':
            self.get_district_info()
        if request['request'] == 'request_pass':
            self.request_pass()
        if request['request'] == 'deny_pass':
            self.deny_pass()
        if request['request'] == 'dismiss_message':
            self.dismiss_message()
        if request['request'] == 'approve_pass':
            self.approve_pass()
        if request['request'] == 'back_from_pass':
            self.back_from_pass()
        if request['request'] == 'set_notification':
            self.set_notification()
        if request['request'] == 'get_teacher_stats':
            self.get_teacher_stats()
        if request['request'] == 'get_teacher_users':
            self.get_teacher_users()
        if request['request'] == 'get_user_from_name':
            self.get_user_from_name()
        if request['request'] == 'send_custom_message':
            self.send_custom_message()
        if request['request'] == 'get_csv_for_teacher':
            self.get_csv_for_teacher()

    def get_district(self):
        district = self.db.districts.find_one({'domains': {'$in': [self.request['domain']]}})
        if not district:
            self.send({'exists': False})
        else:
            self.send({'exists': True, 'schools': district["schools"]})

    def get_district_info(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return

        district = self.db.districts.find_one({'domains': {'$in': [self.request['domain']]}})
        
        teachers_with_names = []
        for teacher in district['teachers']:
            user = self.db.users.find_one({'email': teacher})
            teachers_with_names.append((user['email'], user['name']))

        self.send({'schools': district["schools"], 'pass': district['pass'], 
                   'teachers': district['teachers'], 'destinations': district.get('destinations'), 
                   'teachers_with_names': teachers_with_names, 'admins': district["admins"], 'analytics': district.get('analytics')})

    def user_exists(self):
        user = self.db.users.find_one({'email': self.request['email']})

        if user:
            self.send({'success': True, 'user_exists': True, 'is_teacher': user['is_teacher']})
        else:
            self.send({'success': True, 'user_exists': False})

    def verify_user(self):
        try:
            idinfo = id_token.verify_oauth2_token(self.request['token'], requests.Request(), CLIENT_ID)

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            if idinfo['email'] == self.request['email']:
                return True
            else:
                return False
        except ValueError:
            try: 
                idinfo = id_token.verify_oauth2_token(self.request['token'], requests.Request(), CLIENT_ID_2)

                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError('Wrong issuer.')

                if idinfo['email'] == self.request['email']:
                    return True
                else:
                    return False
            except ValueError:
                return False

    def isAdmin(self):
        if not self.verify_user():
            return False
        user = self.db.users.find_one({'email': self.request['email']})
        district = self.db.districts.find_one({'domains': {"$in": [user["domain"]]}})

        if user['email'] in district['admins']:
            return True
        else:
            return False
    
    def signin(self):
        try:
            idinfo = id_token.verify_oauth2_token(self.request['token'], requests.Request(), CLIENT_ID)

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            user = self.db.users.find_one({'email': idinfo['email']})
            if user:
                self.send({'success': True, 'user_exists': True})
            else:
                self.send({'success': True, 'user_exists': False})
        except ValueError as e:
            try: 
                idinfo = id_token.verify_oauth2_token(self.request['token'], requests.Request(), CLIENT_ID_2)

                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError('Wrong issuer.')

                user = self.db.users.find_one({'email': idinfo['email']})
                if user:
                    self.send({'success': True, 'user_exists': True})
                else:
                    self.send({'success': True, 'user_exists': False})
            except ValueError as e:
                self.send({'error': str(e)})

    def add_user(self):
        if 'school' in self.request:
            school = self.request['school']
        else:
            school = None

        domain = self.request['email'].split("@")[1]

        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        self.db.users.insert_one({
            'name': self.request['name'],
            'email': self.request['email'],
            'is_teacher': self.request['is_teacher'],
            'school': school,
            'domain': domain,
            'history': [],
            'messages': [],
            'notifications': []
        })

        district = self.db.districts.find_one({'domains': {'$in': [domain]}})

        if not district:
            self.send({'error': 'dde'})
            return
        if self.request['is_teacher']:
            self.db.districts.find_one_and_update({'domains': {'$in': [domain]}}, {'$push': {'teachers': self.request['email']}})
        else:
            self.db.districts.find_one_and_update({'domains': {'$in': [domain]}}, {'$push': {'students': self.request['email']}})

        self.send({'success': True})

    def add_district(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return

        if 'schools' in self.request:
            schools = self.request['schools']
        else:
            schools = None

        self.db.districts.insert_one({
            'domains': self.request['domains'],
            'pass': self.request['pass'],
            'schools': schools,
            'admins': [self.request['email']]
        })

        self.send({'success': True})

    def get_user(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return

        current_user = self.db.users.find_one({'email': self.request['email']})
        user_is_user = self.request['email'] == self.request['user']
        user = self.db.users.find_one({'email': self.request['user']})
        if current_user['is_teacher']:
            self.send({'success': True, 'user': user})
        else:
            if user_is_user:
                self.send({'success': True, 'user': user})
            else:
                self.send({'error': 'unu'}) 
                return    
        if not self.request.get('once'):
            clients.append(self.client)
            while True:
                sleep(1)
                if not self.client in clients:
                    return
                new_user = self.db.users.find_one({'email': self.request['user']})
                if new_user != user:
                    user = new_user
                    self.send({'success': True, 'user': user})

    def get_user_from_name(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        current_user = self.db.users.find_one({'email': self.request['email']})
        user = self.db.users.find_one({'name': self.request['user'], 'history.teacher': current_user['name']})
        if current_user['is_teacher']:
            self.send({'success': True, 'user': user})


    def send(self, message):
        message['response_id'] = self.request['request_id']
        string_message = dumps(message)
        self.server.send_message(self.client, string_message)
    
    def send_to_client(self, message, client):
        string_message = dumps(message)
        self.server.send_message(client, string_message)

    def send_message(self, message, users):
        for email in users:
            self.db.users.update_one({'email': email}, {'$push': {'messages': message}})
            user = self.db.users.find_one({'email': email})
            if {'user': user['email'], 'message': message['timestamp']} not in nots_sent:
                for noti in user['notifications']:
                    if noti['type'] == 'ios':
                        apns = APNs(use_sandbox=True, cert_file="crt.pem", key_file='key.pem')
                        payload = Payload(alert="{}: {}".format(message['title'], message['subTitle']), sound="default", mutable_content=True)
                        apns.gateway_server.send_notification(noti['id'], payload)
                nots_sent.append({'user': user['email'], 'message': message['timestamp']})

    def request_pass(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        
        user = self.db.users.find_one({'email': self.request['email']})
        district = self.db.districts.find_one({'domains': {'$in': [self.request['email'].split('@')[1]]}})
        
        new_history = []
        for passs in user['history']:
            if passs['name'] != 'Free':
                new_history.append(passs)

        passes_left = int(district['pass']) - len(new_history)
        message = {
            'user': user['name'],
            'email': self.request['email'],
            'type': 'pass_request',
            'title': 'Pass Request',
            'subTitle': '{} would like to use a pass to go to the {}. This user has {} passes left.'.format(user['name'], self.request['dest'], passes_left),
            'destination': self.request['dest'],
            'timestamp': datetime.datetime.now().timestamp(),
            'pass': passes_left
        }

        self.send_message(message, [self.request['user']])

        self.send({"success": True})

    def deny_pass(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        self.db.users.update_one({'email': self.request['email']}, {'$pull': {'messages': {'timestamp': self.request['message_time']}}})
        user = self.db.users.find_one({'email': self.request['email']})
        message = {
            'user': user['name'],
            'email': self.request['email'],
            'type': 'pass_rejected',
            'title': 'Pass Rejected',
            'subTitle': 'Your request to use a pass was rejected.',
            'timestamp': datetime.datetime.now().timestamp()
        }

        self.send_message(message, [self.request['user']])
        self.send({"success": True})

    def dismiss_message(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        self.db.users.update_one({'email': self.request['email']}, {'$pull': {'messages': {'timestamp': self.request['message_time']}}})
        self.send({"success": True})

    def approve_pass(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return

        district = self.db.districts.find_one({'domains': {'$in': [self.request['email'].split('@')[1]]}})
        teacher = self.db.users.find_one({'email': self.request['email']})

        user = self.db.users.find_one({'email': self.request['user']}) 

        new_history = []
        for passs in user['history']:
            if passs['name'] != 'Free':
                new_history.append(passs)

        name = 'Free' if self.request['free'] else int(district['pass']) - len(new_history)        

        timestamp = datetime.datetime.now().timestamp()
        self.db.users.update_one({'email': self.request['user']}, {'$push': {'history': {
            'destination': self.request['destination'],
            'teacher': teacher['name'],
            'timestamp': timestamp,
            'minutes': self.request['minutes'],
            'name': name
        }}})

        message = {
            'user': teacher['name'],
            'email': teacher['email'],
            'type': 'pass_approved',
            'title': 'Pass Approved',
            'subTitle': 'Your request to go to the {} was approved. You have {} minutes. The timer starts now.'.format(self.request['destination'], self.request['minutes']),
            'timestamp': timestamp,
            'minutes': self.request['minutes'],
            'name': name
        }

        self.send_message(message, [self.request['user']])
        self.send({'success': True})
        
        sleep(int(self.request['minutes'] * 60))
        user = self.db.users.find_one({'email': self.request['user']})
        history = user['history']
        for passs in history:
            if passs['timestamp'] == timestamp and passs.get('timestamp_end'):
                return

        timestamp2 = datetime.datetime.now().timestamp()
        self.send_message({
            'user': teacher['name'],
            'email': teacher['email'],
            'type': 'pass_done',
            'title': "Time's up",
            'subTitle': 'Your pass time is over. Get back as soon as possible.',
            'timestamp': timestamp2,
            'pass_time': timestamp,
            'name': name
        }, [self.request['user']])

        self.send_message({
            'user': user['name'],
            'email': user['email'],
            'type': 'pass_done',
            'title': "Time's up",
            'subTitle': "{}'s pass time is over.".format(user['name']),
            'timestamp': timestamp2,
            'pass_time': timestamp,
            'name': name
        }, [self.request['email']])

    def back_from_pass(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        self.db.users.update_one({'email': self.request['email'], 'history.timestamp': self.request['timestamp']}, 
                                 {'$set': {'history.$.timestamp_end': datetime.datetime.now().timestamp()}})
        user = self.db.users.find_one({'email': self.request['email']})
        self.send_message({
            'user': user['name'],
            'email': user['email'],
            'type': 'pass_done',
            'title': 'Pass is done',
            'subTitle': "{} is back.".format(user['name']),
            'timestamp': datetime.datetime.now().timestamp()
        }, [self.request['teacher']])
        self.send({'success': True})

    def set_notification(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        if self.request['ios']:
            self.db.users.update_one({'email': self.request['email']}, 
                                     {'$addToSet': 
                                        {'notifications': 
                                            {'type': 'ios', 'id': self.request['id']}
                                        }
                                     }
                                    )
        else:
            self.db.users.update_one({'email': self.request['email']}, 
                                     {'$addToSet': 
                                        {'notifications': 
                                            {'type': 'web', 'id': self.request['id']}
                                        }
                                     }
                                    )
        self.send({'success': True})

    def get_teacher_users(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        user = self.db.users.find_one({'email': self.request['email']})
        district = self.db.districts.find_one({'domains': {"$in": [user["domain"]]}})
        if not user["is_teacher"]:
            self.send({'error': 'unt'})
            return
        self.send({'users': self.db.users.distinct("name", {"is_teacher": False, "domain": {"$in": district['domains']}, "history.teacher": user['name']})})

    def get_teacher_stats(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        teacher = self.db.users.find_one({'email': self.request['email']})
        usersRef = self.db.users.find({'history.teacher': teacher['name']}, {'history': True, 'name': True})
        
        passes = []
        intervals = 0
        minutesTotal = 0
        counts = {}
        freePasses = []
        regularPasses = []
        currently_out = []

        for user in usersRef:
            for passs in user['history']:
                if passs['teacher'] == teacher['name']:
                    passs['user'] = user['name']
                    passes.append(passs)
                    if passs['name'] == 'Free':
                        freePasses.append(passs)
                    else:
                        regularPasses.append(passs)
                    counts[passs['user']] = counts.get(passs['user'], 0) + 1
                    if not passs.get('timestamp_end'):
                        currently_out.append(passs['user'])
                    if passs.get('timestamp_end'):
                        intervals += passs['timestamp_end'] - passs['timestamp']
                    minutesTotal += passs['minutes']
        
        mvp = max(counts, key=counts.get)

        passesIssued = len(passes)
            
        avgInterval = str(int((intervals / passesIssued) / 60)) + ' minutes and ' + str(int(intervals / passesIssued) % 60) + ' seconds'
        avgMinutes = int(minutesTotal / passesIssued)

        self.send({'passesIssued': passesIssued, 'avgInterval': avgInterval, 'avgMinutes': avgMinutes, 'freePasses': len(freePasses), 'regularPasses': len(regularPasses), 'mvp': mvp, 'currentlyOut': currently_out})

    def send_custom_message(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        user = self.db.users.find_one({'email': self.request['email']})
        self.send_message({
            'user': user['name'],
            'email': user['email'],
            'type': 'custom',
            'title': user['name'],
            'subTitle': self.request['message'],
            'timestamp': datetime.datetime.now().timestamp()
        }, [self.request['user']])
        self.send({'success': True})

    def send_custom_message_to_all(self):
        if not self.isAdmin():
            self.send({'error': 'una'})
            return
        user = self.db.users.find_one({'email': self.request['email']})
        district = self.db.districts.find_one({'domains': {"$in": [user["domain"]]}})
        self.send_message({
            'user': user['name'],
            'email': user['email'],
            'type': 'custom',
            'title': user['name'],
            'subTitle': self.request['message'],
            'timestamp': datetime.datetime.now().timestamp()
        }, district['students'])
        self.send({'success': True})

    def get_csv_for_teacher(self):
        if not self.verify_user():
            self.send({'error': 'uns'})
            return
        teacher = self.db.users.find_one({'email': self.request['email']})
        usersRef = self.db.users.find({'history.teacher': teacher['name']}, {'history': True, 'name': True})
        text = "User,Pass,Destination,Teacher,Minutes,Timestamp,End Time\n"

        for user in usersRef:
            for passs in user['history']:
                if passs['teacher'] == teacher['name']:
                    text += (user['name'] + ',')
                    text += (str(passs['name']) + ',')
                    text += (passs['destination'] + ',')
                    text += (passs['teacher'] + ',')
                    text += (str(passs['minutes']) + ',')

                    timestamp = datetime.datetime.fromtimestamp(
                                    passs['timestamp']
                                ).strftime('%Y-%m-%d %H:%M:%S')
                    text += (timestamp + ',')

                    timestamp_end = datetime.datetime.fromtimestamp(
                                        passs['timestamp_end']
                                    ).strftime('%Y-%m-%d %H:%M:%S')
                    text += (timestamp_end + ',')
                    text += ('\n')
        self.send({'csv_data': text})             
        