import urllib.request as request
import datetime

hostName = "localhost"
currentTime = datetime.date.today()
if (currentTime.weekday() == 4):
    response = request.urlopen('http://' + hostName + ':3000/weeklystatus/fridayreminder')
    html = response.read()
    print(html)
elif (currentTime.weekday() == 1):
    response = request.urlopen('http://' + hostName + ':3000/weeklystatus/mondayreminder')
    html = response.read()
    print(html)
