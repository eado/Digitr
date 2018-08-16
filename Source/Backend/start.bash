source ${BACKEND}/venv/bin/activate
mongod --port 3232 &
sudo python3 ${BACKEND}/main.py