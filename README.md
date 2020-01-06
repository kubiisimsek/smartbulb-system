## Smart Bulb System
**Hardware and software information** 

As hardware, NodeMCU Lolin V3 (integrated ESP8266) and 4 RGB leds

As software for mobile application,React-Native (Android only)

**Purpose of the system** 

In this system,aim to support mentally by selecting a mode to reflect the mood of user also make it enjoyable with various colors. There are also musics (via Spotify) that suits your mood.

**How to work ?** 

*System works with wifi network, not bluetooth.*

Firstly, a wifi network (Access Point) and websocket is created by NodeMCU.User must log in to the mobile app to connect to this network to make settings .In the mobile application, the settings screen lists wifi networks if the user has not made the settings.The user sends the settings to the smart bulb via websocket by selecting the wifi network he wants to connect the smart bulb and entering the password.Smart bulb connects to desired wifi network by turning off access point.

**Images in application** 

![enter image description here](https://i.ibb.co/nggx1Ln/app-images.png)

**NOTES** 

On react-native, I installed the wifi manager package that I found. But I wrote the wifi manager codes as my own native module because it corrupted my project.

Original package [react-native-wifi-manager](https://github.com/skierkowski/react-native-wifi-manager)

My package in `android/app/src/main/java/com/bitirmedeneme`

Also,i added a function to my own package that finds the IP addresses of devices on the wifi network.
