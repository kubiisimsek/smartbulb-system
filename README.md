## Smart Bulb System
**Hardware and software information** *separate paragraph*
As hardware, NodeMCU Lolin V3 (integrated ESP8266) and 4 RGB leds *separate paragraph*
As software for mobile application,React-Native (Android only)

**Purpose of the system** *separate paragraph*
In this system,aim to support mentally by selecting a mode to reflect the mood of user also make it enjoyable with various colors. There are also musics (via Spotify) that suits your mood.

**How to work ?** *separate paragraph*
*System works with wifi network, not bluetooth.* *separate paragraph*

Firstly, a wifi network (Access Point) and websocket is created by NodeMCU.User must log in to the mobile app to connect to this network to make settings .In the mobile application, the settings screen lists wifi networks if the user has not made the settings.The user sends the settings to the smart bulb via websocket by selecting the wifi network he wants to connect the smart bulb and entering the password.Smart bulb connects to desired wifi network by turning off access point.
