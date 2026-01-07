#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <WiFi.h>
#include "DHT.h"

//FIREBASE (NILDA MAQUIRAN - google )

  #define API_KEY "AIzaSyCR7xVbCAKUL03u-dNa2E7-mVTkZhw1zWU"
  #define DATABASE_URL "https://iot-rwatering-system-default-rtdb.asia-southeast1.firebasedatabase.app/" 

//FIREBASE OBJECTS

  FirebaseData fbdo;
  FirebaseAuth auth;
  FirebaseConfig config;
  FirebaseData stream;//

//MODULE SENSORS PINS

  constexpr uint8_t soilMoisture1 = 34, soilMoisture2 = 35, dhtPin = 13, dhttype = DHT22;
  constexpr uint8_t relay = 23, trigPin = 22, echoPin = 18;

//DISPLAY DATA 

  //SOIL

    int soilValue1 = 0, soilValue2 = 0;
    int smPercent1 = 0, smPercent2 = 0, lsmPercent1 = -1, lsmPercent2 = -1;

  //DHT

    float h = 0.0, t = 0.0, lh = -1.0, lt = -1.0;

  //ULTRASONIC

    const float soundSpeed = 0.0343;
    long duration;

    //  TANK LENGHT
    
      float maxLenght = 0.0;

    // WATER LVL

      int wlPercent = 0;
      float distanceCm = 0;
    
  //RELAY
    
//    int litter = 0, mlitter = 0:
//    float timer = 0.0;  
//    long waterValue = 0;  // long for 32L or more 
      bool relayStatus = false;

// SETTINGS

  //RELAY WATER PUMP

//    int waterValue = 0;

  //ULTRASONIC


//CONFIGURATION SETTING
DHT dht(dhtPin, dhttype);
const char* ssid = "vivo Y18";
const char* pass = "00000000";

//

unsigned long sendDataPrevMilis = 0;

//

bool fireBaseConnection = false;

//FEATURE FUNCTION

  void setmaxLenght(){
    
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    duration = pulseIn(echoPin, HIGH);
    maxLenght = duration * soundSpeed / 2;

    if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/ultrasonic/waterTankLvL", maxLenght)) {}
    
  }

  void readwlPercent(){

    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    duration = pulseIn(echoPin, HIGH);
    distanceCm = duration * soundSpeed / 2;

    wlPercent = ((maxLenght - distanceCm) / maxLenght) * 100.0;
    wlPercent = constrain(wlPercent, 0, 100);

    if (Firebase.RTDB.setInt(&fbdo, "/client/sensors/ultrasonic/waterTankPercent", wlPercent)) {}

  }

//EVENT RESPONSER

  void streamCallback(FirebaseStream data) {
    // This function triggers ONLY when the database value changes
    String path = data.dataPath();

    // RELAY

      if (path == "/sensors/relay/relayStatus") {

        relayStatus = data.boolData();
        Serial.printf("Stream triggered! Path: %s, Value: %d\n", data.dataPath().c_str(), relayStatus);   

        if (relayStatus) {
          digitalWrite(relay, HIGH); // Turning ON (Relays are often active LOW)
          Serial.println("Relay ACTIVATED");

        } else {
          digitalWrite(relay, LOW); // Turning OFF
          Serial.println("Relay DEACTIVATED");

        }
      }

    //ULTRASONIC

      //TANK LVL
        else if (path == "/sensors/ultrasonic/setmaxLenghtStatus"){

          if (data.boolData() == true) {
            setmaxLenght();
            
            Firebase.RTDB.setBool(&fbdo, "/esp/sensors/ultrasonic/setmaxLenghtStatus", false);
        
          }
        }

      //WATER LVL
        else if(path == "/sensors/ultrasonic/readwlPercentStatus"){
          
          if (data.boolData() == true) {
            readwlPercent();
            
            Firebase.RTDB.setBool(&fbdo, "/esp/sensors/ultrasonic/readwlPercentStatus", false);

          }

        }
      
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup() {

  //log

    Serial.begin(115200);
    dht.begin();

  //PIN DECLARATION

    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(relay, OUTPUT);
  
    //SET LOW = OFF

      digitalWrite(trigPin, LOW);
      digitalWrite(relay, LOW);

  // nested wifi

    WiFi.begin(ssid, pass);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
      Serial.print(".");
      delay(300);
    }
    Serial.println("\nConnected with IP: ");
    Serial.println(WiFi.localIP());

  //Establishing connection with FireBase, RealTime DataBase

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;  

  if(Firebase.signUp(&config, &auth, "","")){
    Serial.println("FireBase Connected");
    fireBaseConnection = true;
  }else{
    Serial.printf("Signup Error: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (!Firebase.RTDB.beginStream(&stream, "/esp")) {
    Serial.printf("Stream begin error: %s\n", stream.errorReason().c_str());
  }

  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);

  //Pull data from settings

  if (Firebase.RTDB.getFloat(&fbdo, "/client/sensors/ultrasonic/waterTankLvL")) {
    maxLenght = fbdo.floatData();
  }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
//KEEP THE STREAM CONNECTED
  void streamTimeoutCallback(bool timeout) {
      if (timeout) Serial.println("Stream timeout, resuming...");
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void loop() {
  if (Firebase.ready() && fireBaseConnection && (millis() - sendDataPrevMilis > 30000|| sendDataPrevMilis == 0)){
    sendDataPrevMilis = millis();
    
    Serial.println("Reading Soil Moisture Sensors");

    soilValue1 = analogRead(soilMoisture1);
    soilValue2 = analogRead(soilMoisture2);
    smPercent1 = constrain(map(soilValue1, 4095, 1700, 0, 100), 0, 100);
    smPercent2 = constrain(map(soilValue2, 4095, 1700, 0, 100), 0, 100);

    Serial.println("Reading DHT22 Sensor");

    h = dht.readHumidity();
    t = dht.readTemperature();

    Serial.println("Updating Firebase...");


    // Check Soil Moisture 1
    
    if (smPercent1 != lsmPercent1) {
      if (Firebase.RTDB.setInt(&fbdo, "/client/sensors/soilMoisture/soil1", smPercent1)) {
        lsmPercent1 = smPercent1; // Only update 'last' if send was successful
        Serial.println("Updated: Soil 1");
      }
    }

    // Check Soil Moisture 2

    if (smPercent2 != lsmPercent2) {
      if (Firebase.RTDB.setInt(&fbdo, "/client/sensors/soilMoisture/soil2", smPercent2)) {
        lsmPercent2 = smPercent2;
        Serial.println("Updated: Soil 2");
      }
    }

    // Check Humidity (using isnan to ensure sensor is actually working)

    if (!isnan(h) && h != lh) {
      if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/dht/humidity", h)) {
        lh = h;
        Serial.println("Updated: Humidity");
      }
    }

    // Check Temperature
    if (!isnan(t) && t != lt) {
      if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/dht/temperature", t)) {
        lt = t;
        Serial.println("Updated: Temperature");
      }
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

