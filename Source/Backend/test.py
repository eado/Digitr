# import random, string
# from pymongo import MongoClient

# db = MongoClient(port=3232).digitr

# def rname():
#     letters = string.ascii_lowercase
#     return ''.join(random.choice(letters) for i in range(5))

# def remail(is_teacher):
#     letters = string.ascii_lowercase
#     email = ''.join(random.choice(letters) for i in range(5)) + '@mtka.org'
#     if is_teacher:
#         db.districts.update({'domains': 'mtka.org'}, {'$push': {'teachers': email}})
#     else:
#         db.districts.update({'domains': 'mtka.org'}, {'$push': {'students': email}})
#     return email

# i = 0

# while i < 250:
#     i += 1
#     db.users.insert_one({'name': rname(), 'email': remail(True), 'is_teacher': True, 'school': 'MME', 'domain': 'mtka.org', 'history': [{'name': 18, 'teacher': 'Omar Elamri', 'destination': 'Library', 'timestamp': 10283737, 'timestamp_end': 1038438, 'minutes': 5}], 'messages': [], 'notifications': []})
#     db.users.insert_one({'name': rname(), 'email': remail(False), 'is_teacher': False, 'school': 'MMW', 'domain': 'mtka.org', 'history': [{'name': 18, 'teacher': 'Omar Elamri', 'destination': 'Library', 'timestamp': 10283737, 'timestamp_end': 1038438, 'minutes': 5}], 'messages': [], 'notifications': []})
#     db.users.insert_one({'name': rname(), 'email': remail(False), 'is_teacher': False, 'school': 'MME', 'domain': 'mtka.org', 'history': [{'name': 18, 'teacher': 'Omar Elamri', 'destination': 'Library', 'timestamp': 10283737, 'timestamp_end': 1038438, 'minutes': 5}], 'messages': [], 'notifications': []})
#     db.users.insert_one({'name': rname(), 'email': remail(True), 'is_teacher': True, 'school': 'MMW', 'domain': 'mtka.org', 'history': [{'name': 18, 'teacher': 'Omar Elamri', 'destination': 'Library', 'timestamp': 10283737, 'timestamp_end': 1038438, 'minutes': 5}], 'messages': [], 'notifications': []})

import paypalrestsdk
paypalrestsdk.configure({
    "mode": "sandbox",
    "client_id": "AZk1bqqyC2FutRRHRb7ej_jKsZHsvGD-8aSm29mj-7znJYVQvNtQHoIq2j3qWdeQlxJ6ypY3LkpXMqtC",
    "client_secret": "EF-F_ZocEC30OhS5rL5HtoiZW-vE1jnpMEewFvE3lmiGLhTW-Lrm-cRmHJvnDp3OS4mgJuzDj-dMDcW4"
})

payment = paypalrestsdk.Payment({
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"},
    "redirect_urls": {
        "return_url": "http://localhost:8100/payment/execute",
        "cancel_url": "http://localhost:8100/"},
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Digitr Analytics",
                "sku": "analytics",
                "price": "1.00",
                "currency": "USD",
                "quantity": 1}]},
        "amount": {
            "total": "1.00",
            "currency": "USD"},
        "description": "Payment for 2 users for one year."}]})

if payment.create():
    print("yay")
else:
    print(payment.error)

for link in payment.links:
    if link.rel == "approval_url":
        # Convert to str to avoid Google App Engine Unicode issue
        # https://github.com/paypal/rest-api-sdk-python/pull/58
        approval_url = str(link.href)
        print("Redirect for approval: %s" % (approval_url))
