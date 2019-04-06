from pymongo import MongoClient

db = MongoClient(port=3232)

domain = input("Domain: ")
district = db.districts.find_one({'domains': domain})
usersRef = db.users.find({'domain': {'$in': district['domains']}}, {'history': True, 'name': True})
text = "User,Pass,Destination,Teacher,Minutes,Timestamp(EST),End Time(EST)\n"

for user in usersRef:
    for passs in user['history']:
        text += (user['name'] + ',')
        text += (str(passs['name']) + ',')
        text += (passs['destination'] + ',')
        text += (passs['teacher'] + ',')
        text += (str(passs['minutes']) + ',')

        timestamp = (datetime.datetime.fromtimestamp(
                        passs['timestamp']
                    ) - datetime.timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S')
        text += (timestamp + ',')

        timestamp_end = (datetime.datetime.fromtimestamp(
                            passs.get('timestamp_end', passs['timestamp'])
                        ) - datetime.timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S')
        text += (timestamp_end + ',')
        text += ('\n')

file = open('csv_' + domain + '.csv', 'w')
file.write(text)
