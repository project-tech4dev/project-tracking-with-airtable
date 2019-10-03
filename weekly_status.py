import urllib.request as request
import datetime
import sys

reminders = sys.argv[1]
hostName = "localhost"
port = 3000
print(sys.argv)
response = request.urlopen('http://' + hostName + ':'+ str(port) + reminders)
html = response.read()
print(html)