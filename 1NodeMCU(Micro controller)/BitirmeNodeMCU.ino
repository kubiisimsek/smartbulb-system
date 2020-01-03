/*  Graduation Project - Smart Bulb
 *            
 *            -Explanation-
 *            
 *  Chip : NodeMCU LoLin ESP8266 CH340 v3
 *  Used pins : D5(14),D6(12),D7(13)
 *  Used leds : 3 RGB Led (Common anode and parallel connected)
 *  
 *  NOTE : Arduino uno provide the 8-bit PWM but NodeMCU 10-bit.So RGB value is between 0 to 1023.
 *  
 *  The purpose of the project,system communication 
 *  with mobile application on the same network.This 
 *  communication is provided by the socket created by ESP8266.
 *  
 *           -Useful Resources-
 *  http://www.martyncurrey.com/esp8266-and-the-arduino-ide-part-9-websockets/
 *  http://www.elektrobot.net/arduino-uno-esp8266-kullanimi-tcp-client-olusturma/
 *  https://medium.com/oracledevs/monitoring-sensor-data-in-jet-mobile-app-over-websockets-part-1-2-f7fa81d9774b
 *  https://maker.robotistan.com/kategori/elektronik-projeler-devreler/iot-projeleri/esp-8266/
 *  
 */


#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsServer.h>
#include <Hash.h>
#include <ESP8266mDNS.h>
#include <EEPROM.h>

String SSID     = "";
String PASSWORD = "";

// EEPROM SSID PW
String EESSID = "";
String EEPW = "";


ESP8266WiFiMulti WiFiMulti;
WebSocketsServer webSocket = WebSocketsServer(81);
WebSocketsServer APsocket = WebSocketsServer(81);



//softAP Variables
bool connectWifi=false;
bool isConfigureOK=false;


// PINS
const int Red=13;
const int Green=12;
const int Blue=14;

// VARIABLES
// for moods
int Rvalue=1023;
int Gvalue=1023;
int Bvalue=1023;



// ANIMATION VARIABLES
int RedValue=1023;
int GreenValue=1023;
int BlueValue=1023;
bool animationState=false;
int selectAnimation=0;



// MILLIS FUNCTION VARIABLES
unsigned long previousTime=0;
unsigned long currentTime;

// SETUP -------------------------------------------------------------------------------------------------
void setup() {
  EEPROM.begin(50);

  pinMode(Red,OUTPUT);
  pinMode(Green,OUTPUT);
  pinMode(Blue,OUTPUT);

  Serial.begin(115200);
  delay(1000);
  
  wifiAPconfig();


  randomSeed(analogRead(0));
}

void wifiAPconfig(){
  bool state=eepromRead();
  if(state == true){

    Serial.println("Kayıt bulundu:"+EESSID+" "+EEPW);
    SSID=EESSID;
    PASSWORD=EEPW;
    delay(1000);
    isConfigureOK = true;
    wifiSTAconfig();
  }
  else{
    /*
        Firstly,user must connect the bulb from access point created by esp8266.
        The user will then make the necessary settings to connect to own internet from the mobile device.
    */
    webSocket.close();
    WiFi.mode(WIFI_AP);
    bool apState = WiFi.softAP("SmartBulb");
    if(apState == true){
        APsocket.begin();
        APsocket.onEvent(APsocketEvent);
        Serial.println("IP address:");
        Serial.println(WiFi.softAPIP());
    }
  }
}


// This section works if the user has made the necessary settings.
void wifiSTAconfig(){
    APsocket.close();
    if(isConfigureOK == true){
        bool dis = WiFi.softAPdisconnect(true);
        Serial.println("Çıkış yapıldı:"+dis);

        WiFi.mode(WIFI_STA);
        Serial.println(SSID+" "+PASSWORD);
        WiFi.begin(SSID, PASSWORD);
        
        // The bulb lights up red until NodeMCU joins the network.
        analogWrite(Red,0);
        analogWrite(Green,1023);
        analogWrite(Blue,1023);
        
        int connectTimeOutCounter=0;
        while(WiFi.status() != WL_CONNECTED) {
              delay(100);
              Serial.println(".");
              /*
                If NodeMCU fails to connect to the Internet, the settings are reset and switched to Access Point mode.
                This timeout period is 5 second.
                (Loop delay 100ms.If it repeats 100 times it will be 10 second)
              */
              connectTimeOutCounter+=1;
              if(connectTimeOutCounter > 100){
                analogWrite(Red,0);
                analogWrite(Green,0);
                analogWrite(Blue,1023);
                eepromClear();
                wifiAPconfig();
              }
        }
        analogWrite(Red,1023);
        analogWrite(Green,0);
        analogWrite(Blue,1023);
        Serial.println("");
        Serial.println("Hostname:"+WiFi.hostname());
        Serial.println("WiFi connected:"+WiFi.SSID());  
        Serial.println("IP address:");
        Serial.println(WiFi.localIP());
        
        if (!MDNS.begin("smartbulb")) { // Start mDNS "smartbulb.local"
          Serial.println("Error setting up MDNS responder!");
        }
        Serial.println("mDNS responder started: smartbulb.local");

        webSocket.begin();
        webSocket.onEvent(webSocketEvent);
        delay(1500);
        analogWrite(Red,0);
        analogWrite(Green,0);
        analogWrite(Blue,0);
  }
}

// LOOP -------------------------------------------------------------------------------------------------
void loop() {
    
  MDNS.update();

  delay(5);
    
    if(animationState){
      switch(selectAnimation){
        case 1: breathAnimation();
          break;
        case 2: flowAnimation();
          break;
        case 3: pulseAnimation();
          break;
        case 4: melancholyMood();
          break;
        case 5: rainyMood();
          break;
        case 6: feelinMood();
          break;
        case 7: heartMood();
          break;
        case 8: afternoonMood();
          break;
        case 9: aloneMood();
          break;
        case 10: confidenceMood();
          break;
        case 11: happyMood();
          break;
        case 12: positiveMood();
          break;
        case 13: sadMood();
          break;
        case 14: workMood();
          break;
        case 15: partyAnimation();
          break;
      }
    }
    
    APsocket.loop();
    webSocket.loop();
    delay(5);
}

// WEBSOCKETS EVENT FUNCTIONS -------------------------------------------------------------------------------------------------
// ACCESS POINT SOCKET EVENT
void APsocketEvent (uint8_t num, WStype_t type, uint8_t * payload, size_t length){
  switch(type){     
       case WStype_DISCONNECTED:
       {
          openBulb();
          IPAddress ip = webSocket.remoteIP(num);
          Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
       }
       break;
       case WStype_CONNECTED:
       {
          analogWrite(Red,1023);
          analogWrite(Green,200);
          analogWrite(Blue,200);
          IPAddress ip = webSocket.remoteIP(num);
          Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
       }
       break;
       
       case WStype_TEXT:
       { 
          String text = (char*) payload;
          if(text[0] == 'S' && text[1] == 'S' && text[2] == 'I' && text[3] == 'D')
          {
               String temp="";
               for(int i = 4;i < length ; i++)
               {
                  temp+=text[i];
               }
               SSID=temp;
               APsocket.sendTXT(num,"SSID:"+SSID);
          }
          else if(text[0] == 'P' && text[1] == 'W'){
               String temp="";
               for(int i = 2;i < length ; i++)
               {
                  temp+=text[i];
               }
               PASSWORD=temp;
               APsocket.sendTXT(num,"PW:"+PASSWORD);
          }
          if(text == "OK"){
            eepromClear();
            delay(200);
            isConfigureOK=true;
            eepromWrite(SSID,PASSWORD) ? Serial.println("SSID kaydedildi") : Serial.println("SSID kaydedilemedi");
            APsocket.sendTXT(num,"DISCONNECT THE AP");
            delay(500);
             openBulb();
            delay(500);
            APsocket.sendTXT(num, "OK"); 
            isConfigureOK=true;
            wifiSTAconfig();
          }
       }
       break;
  }
}


// USER NETWORK SOCKET EVENT
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) { 
 
    switch(type) {
        case WStype_DISCONNECTED:
          {
            closeBulb();
            openBulb();
          }
            break;
        case WStype_CONNECTED:
          {
            openBulb();
            IPAddress ip = webSocket.remoteIP(num);
            Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
          }
            break;
        case WStype_TEXT:
          { 
              previousTime=0;
              String text = (char*) payload;
              Serial.println(text);
                  if(text == "stop"){
                    animationState=false;
                  }
                  else if(text == "reset"){
                    analogWrite(Red,0);
                    analogWrite(Green,1023);
                    analogWrite(Blue,1023);
                    eepromClear();
                    WiFi.disconnect();
                    wifiAPconfig();
                    delay(1000);
                    analogWrite(Red,0);
                    analogWrite(Green,0);
                    analogWrite(Blue,0);   
                  }
                  else if(text == "close")
                  {
                      animationState=false;
                      closeBulb();
                      webSocket.sendTXT(num, "Bulb is closed.");  
                  }
                  else if(text == "open")
                  {
                    animationState=false;
                    openBulb();
                    webSocket.sendTXT(num, "Bulb is opened.");  
                  }
                  else if(text == "breathAnimation")
                  { 
                      selectAnimation=1;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "Breath animation is started.");  
                  }
                  else if(text == "flowAnimation")
                  { 
                      selectAnimation=2;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "Flow animation is started.");  
                  }
                  else if(text == "pulseAnimation")
                  { 
                      selectAnimation=3;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "Pulse animation is started.");  
                  }
                  else if(text == "partyAnimation")
                  { 
                      selectAnimation=15;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "Party animation is started.");  
                  }
                  else if(text == "melancholyMood")
                  { 
                      Rvalue=225;
                      Gvalue=0;
                      Bvalue=150;
                      selectAnimation=4;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "melancholyMood is started.");  
                  }
                  else if(text == "rainyMood")
                  { 
                      Rvalue=0;
                      Gvalue=100;
                      Bvalue=255;
                      selectAnimation=5;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "rainyMood is started.");  
                  }
                  else if(text == "feelinMood")
                  { 
                      Rvalue=100;
                      Gvalue=150;
                      Bvalue=0;
                      selectAnimation=6;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "feelinMood is started.");  
                  }
                  else if(text == "heartMood")
                  { 
                      Rvalue=255;
                      Gvalue=100;
                      Bvalue=100;
                      selectAnimation=7;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "heartMood is started.");  
                  }
                  else if(text == "afternoonMood")
                  { 
                      Rvalue=255;
                      Gvalue=130;
                      Bvalue=40;
                      selectAnimation=8;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "afternoonMood is started.");  
                  }
                  else if(text == "aloneMood")
                  { 
                      Rvalue=40;
                      Gvalue=30;
                      Bvalue=125;
                      selectAnimation=9;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "aloneMood is started.");  
                  }
                  else if(text == "confidenceMood")
                  { 
                      Rvalue=255;
                      Gvalue=50;
                      Bvalue=0;
                      selectAnimation=10;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "confidenceMood is started.");  
                  }
                  else if(text == "happyMood")
                  { 
                      Rvalue=0;
                      Gvalue=255;
                      Bvalue=130;
                      selectAnimation=11;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "happyMood is started.");  
                  }
                  else if(text == "positiveMood")
                  { 
                      Rvalue=240;
                      Gvalue=130;
                      Bvalue=240;
                      selectAnimation=12;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "positiveMood is started.");  
                  }
                  else if(text == "sadMood")
                  { 
                      Rvalue=70;
                      Gvalue=85;
                      Bvalue=100;
                      selectAnimation=13;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "sadMood is started.");  
                  }
                  else if(text == "workMood")
                  { 
                      Rvalue=0;
                      Gvalue=210;
                      Bvalue=60;
                      selectAnimation=14;
                      animationState=true;
                      
                      webSocket.sendTXT(num, "workMood is started.");  
                  }
                  else
                  {
                      Serial.println("Message:"+text);   
                  }

                  if(text[0] == 'S' && text[1] == 'R')
                  {
                    animationState=false;
                    String temp="";
                    for(int i = 2;i < length ; i++)
                    {
                      temp+=text[i];
                    }
                    int value = temp.toInt();
                    setRvalue(value);
                    customColor();
                    webSocket.sendTXT(num,"OK");
                  }
                  else if(text[0] == 'S' && text[1] == 'G')
                  {
                    animationState=false;
                    String temp="";
                    for(int i = 2;i < length ; i++)
                    {
                      temp+=text[i];
                    }
                    int value = temp.toInt();
                    setGvalue(value);
                    customColor();
                    webSocket.sendTXT(num,"OK");
                  }
                  else if(text[0] == 'S' && text[1] == 'B')
                  {
                    animationState=false;
                    String temp="";
                    for(int i = 2;i < length ; i++)
                    {
                      temp+=text[i];
                    }
                    int value = temp.toInt();
                    setBvalue(value);
                    customColor();
                    webSocket.sendTXT(num,"OK");
                  }
                  
          }
            break;
        case WStype_ERROR:
            break;

    }
}



// EEPROM OPERATIONS -------------------------------------------------
void eepromClear(){
  for(int i=0;i<EEPROM.length();i++){
    EEPROM.write(i,0);
  }
  EEPROM.commit();
}

  
bool eepromWrite(String id,String pw) {
  id+=":"+pw+";";
  for (int i = 0; i <= id.length(); i++) {
    EEPROM.write(i, id[i]);
  }
  EEPROM.commit();
  return true;
}


bool eepromRead(){
  String temp;
  String ssid,pw;
  for (int i = 0; i < 50; i++) {
    char tempLetter = EEPROM.read(i);
    if((int)tempLetter != 0){
        if(tempLetter == ';') break; 
        if(tempLetter == ':'){
          ssid=temp;
          temp="";
        }
        else{
          temp+=tempLetter;
        }
      }
  }
  pw=temp;
  if(ssid.length() > 3 && pw.length() > 3){
    Serial.println("Veriler okundu:"+ssid+" "+pw);
    EESSID=ssid;
    EEPW=pw;
    return true;
  }
  else return false;
}

// FUNCTIONS -------------------------------------------------------------------------------------------------

void openBulb(){
  analogWrite(Red,1023-(255*4));
  analogWrite(Green,1023-(255*4));
  analogWrite(Blue,1023-(255*4));
}

void closeBulb(){
  analogWrite(Red,1023-(0*4));
  analogWrite(Green,1023-(0*4));
  analogWrite(Blue,1023-(0*4));
}

void customColor(){
   analogWrite(Red,RedValue);
   analogWrite(Green,GreenValue);
   analogWrite(Blue,BlueValue);
}
void setRvalue(int r){
  RedValue=1023-(r*4);
}
void setGvalue(int g){
  GreenValue=1023-(g*4);
}
void setBvalue(int b){
  BlueValue=1023-(b*4);
}
// -------------- BREATH
void breathAnimation(){
    breathUP(Red);
    breathDOWN(Red);
    breathUP(Green);
    breathDOWN(Green);
    breathUP(Blue);
    breathDOWN(Blue);
}

void breathUP(int pin) {
    for (int i = 0; i < 1023; i++) {
      analogWrite(pin,1023 - i);
      delay(2);
    }
}

void breathDOWN(int pin) {
    for (int i = 0; i < 1023; i++) {
      analogWrite(pin,i);
      delay(1);
    }
}
// --------------------
// -------------- FLOW
void flowAnimation(){
      flowUP(Red,1023);
      flowUP(Blue,1023);
      flowDOWN(Red,1023);
      flowUP(Green,1023);
      flowDOWN(Blue,1023);
      flowUP(Red,1023);
      flowDOWN(Green,1023);
      flowDOWN(Red,1023);
}

void flowUP(int pin,int limit) {
    for (int i = 0; i < limit; i++) {
      analogWrite(pin,limit - i);
      delay(1);
    }
}
void flowDOWN(int pin,int limit) {
    for (int i = 0; i < limit; i++) {
      analogWrite(pin,i);
      delay(1);
    }
}
// ----------------------
// -------------- PULSE

void pulseAnimation(){
  analogWrite(Red,0);
  analogWrite(Green,1023);
  analogWrite(Blue,1023);
  delay(150);
  analogWrite(Red,1023);
  analogWrite(Green,1023);
  analogWrite(Blue,1023);
  delay(150);
  analogWrite(Red,0);
  analogWrite(Green,1023);
  analogWrite(Blue,1023);
  delay(150);
  analogWrite(Red,1023);
  analogWrite(Green,1023);
  analogWrite(Blue,1023);
  delay(1000);
}

void partyAnimation(){
  analogWrite(Red,1023-(255*4));
  delay(150);
  analogWrite(Red,1023-(0*4));
  delay(150);
  analogWrite(Green,1023-(255*4));
  delay(150);
  analogWrite(Green,1023-(0*4));
  delay(150);
  analogWrite(Blue,1023-(255*4));
  delay(150);
  analogWrite(Blue,1023-(0*4));
  delay(150);
  analogWrite(Red,1023-(255*4));
  analogWrite(Green,1023-(255*4));
  delay(150);
  analogWrite(Red,1023-(0*4));
  analogWrite(Green,1023-(0*4));
  delay(150);
  analogWrite(Red,1023-(255*4));
  analogWrite(Blue,1023-(255*4));
  delay(150);
  analogWrite(Red,1023-(0*4));
  analogWrite(Blue,1023-(0*4));
  delay(150);
  analogWrite(Green,1023-(255*4));
  analogWrite(Blue,1023-(255*4));
  delay(150);
  analogWrite(Green,1023-(0*4));
  analogWrite(Blue,1023-(0*4));
  delay(50);
}

// ----------------------
// MOODS -------------------------------------------------------------------------------------------------

// Pink reflects love and lust.In this mode pink tones are used
bool melancholyUP = false;
void melancholyMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 200){
    
    if(Bvalue == 50) melancholyUP=true;
    if(Bvalue == 150) melancholyUP=false;
    
    if(melancholyUP == true) Bvalue++;
    else Bvalue--;
    previousTime = currentTime;
  }
}


// Blue reflects calmness and peace.In this mode blue tones are used.
bool rainyDOWN=false;
void rainyMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 200){
    if(Rvalue == 100 && Gvalue==200) rainyDOWN=true;
    if(Rvalue == 0 && Gvalue==100) rainyDOWN=false;
      if(rainyDOWN == true){
        Rvalue--;
        Gvalue--;
      }
      else{
        Rvalue++;
        Gvalue++;
      }

    
    previousTime = currentTime;
  }
}


// Green represents peace, Yellow represents joy. In this mode green and yellow tones are used.
bool feelinDOWN=false;
void feelinMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 50){
    if(Rvalue == 200 && Gvalue==250) feelinDOWN=true;
    if(Rvalue==50 && Gvalue==100) feelinDOWN=false;
    if(feelinDOWN == true){
      Rvalue--;
      Gvalue--;
    }
    else{
      Rvalue++;
      Gvalue++;
    }
    previousTime = currentTime;
  }
}

// The heart is red as it is accepted by everyone.So in this mode red tones are used.
bool heartUP=false;
void heartMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Gvalue==20 && Bvalue == 20) heartUP=true;
    if(Gvalue==100 && Bvalue == 100)heartUP=false;
    if(heartUP == true){
      Gvalue++;
      Bvalue++;
    }
    else{
      Gvalue--;
      Bvalue--;
    }
    previousTime = currentTime;
  }
}

bool afterDOWN=false;
void afternoonMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Gvalue==190 && Bvalue == 100) afterDOWN=true;
    if(Gvalue==130 && Bvalue == 40)afterDOWN=false;
    if(afterDOWN == true){
      Gvalue--;
      Bvalue--;
    }
    else{
      Gvalue++;
      Bvalue++;
    }
    previousTime = currentTime;
  }
}


bool aloneDOWN=false;
void aloneMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Rvalue==110 && Bvalue == 195) aloneDOWN=true;
    if(Rvalue==40 && Bvalue == 125)aloneDOWN=false;
    if(aloneDOWN == true){
      Rvalue--;
      Bvalue--;
    }
    else{
      Rvalue++;
      Bvalue++;
    }
    previousTime = currentTime;
  }
}

bool confiDOWN=false;
void confidenceMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Gvalue==200 && Bvalue == 150) confiDOWN=true;
    if(Gvalue==50 && Bvalue == 0)confiDOWN=false;
    if(confiDOWN == true){
      Gvalue--;
      Bvalue--;
    }
    else{
      Gvalue++;
      Bvalue++;
    }
    previousTime = currentTime;
  }
}

bool happyState=false;
void happyMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Rvalue==0 && Bvalue == 130) happyState=true;
    if(Rvalue==130 && Bvalue == 0) happyState=false;
    if(happyState == true){
      Rvalue++;
      Bvalue--;
    }
    else{
      Rvalue--;
      Bvalue++;
    }
    previousTime = currentTime;
  }
}


bool positiveState=false;
void positiveMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Rvalue==240 && Gvalue==130 && Bvalue == 240) positiveState=true;
    if(Rvalue==40 && Gvalue==230 && Bvalue == 40) positiveState=false;
    if(positiveState == true){
      Rvalue=Rvalue-2;
      Gvalue++;
      Bvalue=Bvalue-2;
    }
    else{
      Rvalue=Rvalue+2;
      Gvalue--;
      Bvalue=Bvalue+2;
    }
    previousTime = currentTime;
  }
}


bool sadState=false;
void sadMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Rvalue==70 && Gvalue==85 && Bvalue == 100) sadState=true;
    if(Rvalue==50 && Gvalue==65 && Bvalue == 40) sadState=false;
    if(sadState == true){
      Rvalue--;
      Gvalue--;
      Bvalue=Bvalue-3;
    }
    else{
      Rvalue++;
      Gvalue++;
      Bvalue=Bvalue+3;
    }
    previousTime = currentTime;
  }
}

bool workState=false;
void workMood(){
  analogWrite(Red,1023 - (Rvalue*4));
  analogWrite(Green,1023 - (Gvalue*4));
  analogWrite(Blue,1023 - (Bvalue*4));
  currentTime = millis();
  if(currentTime - previousTime > 100){
    if(Rvalue==0 && Gvalue==210) workState=true;
    if(Rvalue==240 && Gvalue==250) workState=false;
    if(workState == true){
      Rvalue=Rvalue+6;
      Gvalue++;
    }
    else{
      Rvalue=Rvalue-6;
      Gvalue--;
    }
    previousTime = currentTime;
  }
}
