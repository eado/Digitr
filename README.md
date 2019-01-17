![Digitr Logo](https://app.digitrapp.com/assets/logo.png)

# Digitr: Tap it. Time it. Count it.

Digitr is a striking new app that efficiently manages users' time-managment, along with administrative features for admins.  
This is the third edition of the app, in which this version combines the administrative features with the Digitr app itself.  

## Features
- Simple layout for users to see their pass usage at a glance.
- In addition, this simple layout makes it easy for users to use passes, and view their history.
- Admins have the feature to deny or approve pass usage, along with viewing other users' pass usage.
- This can be exported to a csv file, or viewed with at some data points in the built-in dashboard.
- Admins can also send custom messages to other users.

## TODO features
- [x] Re-design the general layout.
- [x] Improve the server uptime.
- [ ] Add a scheduling feature for future pass usage.
- [ ] Add more data points to the built-in analytics.
- [ ] Improve uptime across the board.
- [ ] Make the code just a little dryer... (see csv & analytics methods in Source/Backend/responder.py)
- [ ] Actually add some documentation. (docs folder)

## Under the hood
- Server-client communication is done using WebSockets.
  - Data is relayed using JSON serialization.
- Database is MongoDB, and yes—I know your concerns about its journaling.
- The frontend is Angular 4, using the Ionic Platform/Cordova to deploy it to the web and iOS.

#### Test it at: [app.digitrapp.com](https://app.digitrapp.com)
