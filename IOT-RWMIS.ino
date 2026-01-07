#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <WiFi.h>
#include "DHT.h"
#include "time.h"

// TIME
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 28800; // 8 hours * 3600
const int   daylightOffset_sec = 0;
String now;

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

    int readInterval = 0;

  //SOIL

    int soilValue1 = 0, soilValue2 = 0;
    int smPercent1 = 0, smPercent2 = 0, lsmPercent1 = -1, lsmPercent2 = -1, smPercent1Parameter = 0, smPercent2Parameter = 0;

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
    
      int liter = 0, mliter = 0, timer = 0, maxValuePump = 0 ;
      float waterValue = 0.0;  
      bool relayStatus = false, autoMode = false, schedMode = false, alreadyWateredThisMinute = false;


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

  // Returns: "03:30 PM"
  String getTimeOnly() {

    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)) return "Time Error";
    char buffer[15];

    strftime(buffer, sizeof(buffer), "%I:%M %p", &timeinfo);
    return String(buffer);

  }

  // Returns: "2026-01-06"
  String getDateOnly() {
    
    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)) return "Time Error";
    char buffer[15];

    strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
    return String(buffer);

  }

  // Returns: "Tuesday, Jan 06 - 03:30 PM"
  String getDateTime() {

    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)) return "Time Error";
    char buffer[50];

    strftime(buffer, sizeof(buffer), "%A, %b %d - %I:%M %p", &timeinfo);
    return String(buffer);

  }

  void setmaxLenght(){
    
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    duration = pulseIn(echoPin, HIGH);
    maxLenght = duration * soundSpeed / 2;

    if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/ultrasonic/waterTankLvL", maxLenght)){}
    
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
    if (wlPercent == 0) {wlPercent = wlPercent + 1; }

    if (Firebase.RTDB.setInt(&fbdo, "/client/sensors/ultrasonic/waterTankPercent", wlPercent)) {}

  }

  void fastLoadSettings() {
  
    if (Firebase.RTDB.getJSON(&fbdo, "/client")) {
      FirebaseJson &json = fbdo.jsonObject();
      FirebaseJsonData jsonData;

      // 1. Get Settings (Timer, Interval, Soil Parameters)
      if (json.get(jsonData, "setting/timer")) timer = jsonData.intValue;
      if (json.get(jsonData, "setting/readInterval")) readInterval = jsonData.intValue;
      if (json.get(jsonData, "setting/smPercent1Parameter")) smPercent1Parameter = jsonData.intValue;
      if (json.get(jsonData, "setting/smPercent2Parameter")) smPercent2Parameter = jsonData.intValue;

      // 2. Get Tank Calibration (maxLenght)
      if (json.get(jsonData, "sensors/ultrasonic/waterTankLvL")) {
        maxLenght = jsonData.floatValue; 
      }
        
      
    }
  }

  void checkAutoWatering() {

    if (smPercent1 <= smPercent1Parameter || smPercent2 <= smPercent2Parameter) {
      
      // Optional: Only water if tank is not empty (above 10%)
      if (wlPercent > 10) {
        Serial.println("Soil dry! Starting pump...");
        
        digitalWrite(relay, HIGH);
        delay(timer); // Use the timer passed to the function
        digitalWrite(relay, LOW);

        // Set the timestamp in Firebase
        now = getDateTime(); 
        Firebase.RTDB.setString(&fbdo, "/client/sensors/relay/timestamp", now);
        
        
      }
    }

  }


  void checkSchedules() {
  if (!Firebase.ready()) return;

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;

  // 1. Get Current Day (e.g., "Mon") and Time (e.g., "23:20")
  char dayBuff[5], timeBuff[6];
  strftime(dayBuff, sizeof(dayBuff), "%a", &timeinfo); // Returns "Mon", "Tue", etc.
  strftime(timeBuff, sizeof(timeBuff), "%H:%M", &timeinfo);
  String currentDay = String(dayBuff);
  String currentTime = String(timeBuff);

  // 2. Prevent repeat triggers within the same minute
  static String lastCheckedMinute = "";
  if (currentTime == lastCheckedMinute) return;
  
  lastCheckedMinute = currentTime;
  alreadyWateredThisMinute = false;

  // 3. Fetch all schedules from /esp/schedules
  if (Firebase.RTDB.getJSON(&fbdo, "/esp/schedules")) {
    FirebaseJson &json = fbdo.jsonObject();
    size_t count = json.iteratorBegin();
    FirebaseJsonData jsonData;

    for (size_t i = 0; i < count; i++) {
      String key, value;
      int type;
      json.iteratorGet(i, type, key, value);

      String daysStr, s_time;
      
      // Look for "days_of_week" (plural) as per your RTDB structure
      if (json.get(jsonData, key + "/days_of_week")) daysStr = jsonData.stringValue;
      if (json.get(jsonData, key + "/start_time")) s_time = jsonData.stringValue;

      // 4. Logic Check: 
      // Does the current day (e.g. "Mon") exist inside the days string?
      // Does the current time match the start time?
      if (daysStr.indexOf(currentDay) != -1 && s_time == currentTime) {
        Serial.printf("Schedule Match Found! ID: %s | Days: %s\n", key.c_str(), daysStr.c_str());
        
        if (timer > 0) {
          digitalWrite(relay, HIGH);
          delay((unsigned long)timer); 
          digitalWrite(relay, LOW);

          alreadyWateredThisMinute = true; 
          
          now = getDateTime();
          Firebase.RTDB.setString(&fbdo, "/client/sensors/relay/timestamp", now);
          break; // Exit loop after watering is triggered
        }
      }
    }
    json.iteratorEnd();
  }
}

//EVENT RESPONSER

  void streamCallback(FirebaseStream data) {
    // This function triggers ONLY when the database value changes
    String path = data.dataPath();

    //SETTINGS
      
      //
     


      //

        if(path == "/setting") {
          // 1. Get the JSON object from the stream
          FirebaseJson &json = data.jsonObject();
          FirebaseJsonData jsonData;


          // 2. Extract 'liter'
          if (json.get(jsonData, "liter")) {
              liter = jsonData.intValue;

          }

          // 3. Extract 'mliter'
          if (json.get(jsonData, "mliter")) {
              mliter = jsonData.intValue;

          }

          // 4. Extract 'maxValuePump'
          if (json.get(jsonData, "maxValuePump")) {
              maxValuePump = jsonData.intValue;

          }

          // 5. 
          if (json.get(jsonData, "smPercent1Parameter")) {
              smPercent1Parameter = jsonData.intValue;

          }
          
          // 6. 
          if (json.get(jsonData, "smPercent2Parameter")) {
              smPercent2Parameter = jsonData.intValue;

          }

          // 5. 
          if (json.get(jsonData, "readInterval")) {
              readInterval = jsonData.intValue;

          }

          waterValue = ( mliter / 1000.0 ) + liter;

          if (maxValuePump > 0) {
             timer = ( waterValue / maxValuePump) * 3600 * 1000; 
          } else {
             timer = 1; // Prevent divide by zero if pump speed is missing
          }

          Firebase.RTDB.setInt(&fbdo, "/client/setting/timer", timer);
          Firebase.RTDB.setInt(&fbdo, "/client/setting/readInterval", readInterval);
          Firebase.RTDB.setInt(&fbdo, "/client/setting/smPercent1Parameter", smPercent1Parameter);
          Firebase.RTDB.setInt(&fbdo, "/client/setting/smPercent2Parameter", smPercent2Parameter);
        }

        
    // RELAY

      //Water Now

        if (path == "/sensors/relay/relayStatus") {

          relayStatus = data.boolData();
          Serial.printf("Stream triggered! Path: %s, Value: %d\n", data.dataPath().c_str(), relayStatus);   

          digitalWrite(relay, relayStatus ? HIGH : LOW);

          if (relayStatus == true ){
            
            now = getDateTime();

            readwlPercent();

            Firebase.RTDB.setString(&fbdo, "/client/sensors/relay/timestamp", now);

          }
          
        }

      // Auto Mode 

        else if (path == "/sensors/relay/autoMode"){

          autoMode = data.boolData();

        }

      //

        else if (path == "/sensors/relay/schedMode"){

          schedMode = data.boolData();

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
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
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
 
  //Pull data from settings

  fastLoadSettings();


  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
//KEEP THE STREAM CONNECTED
  void streamTimeoutCallback(bool timeout) {
      if (timeout) Serial.println("Stream timeout, resuming...");
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void loop() {
  if (Firebase.ready() && fireBaseConnection && (millis() - sendDataPrevMilis > readInterval|| sendDataPrevMilis == 0)){
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

        now = getDateTime();
        if (Firebase.RTDB.setString(&fbdo, "/client/sensors/soilMoisture/soil1Timestamp", now))

        Serial.println("Updated: Soil 1");

      }

    }

    // Check Soil Moisture 2

    if (smPercent2 != lsmPercent2) {

      if (Firebase.RTDB.setInt(&fbdo, "/client/sensors/soilMoisture/soil2", smPercent2)) {

        lsmPercent2 = smPercent2;

        now = getDateTime();
        if (Firebase.RTDB.setString(&fbdo, "/client/sensors/soilMoisture/soil2Timestamp", now))

        Serial.println("Updated: Soil 2");

      }
    }

    // Check Humidity (using isnan to ensure sensor is actually working)

    if (!isnan(h) && h != lh) {

      if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/dht/humidity", h)) {

        lh = h;

        now = getDateTime();
        if (Firebase.RTDB.setString(&fbdo, "/client/sensors/dht/humidityTimestamp", now))

        Serial.println("Updated: Humidity");

      }

    }

    // Check Temperature
    if (!isnan(t) && t != lt) {

      if (Firebase.RTDB.setFloat(&fbdo, "/client/sensors/dht/temperature", t)) {

        lt = t;

        now = getDateTime();
        if (Firebase.RTDB.setString(&fbdo, "/client/sensors/dht/temperatureTimestamp", now))

        Serial.println("Updated: Temperature");
      }
    }    

  }

  if (autoMode == true ) {
      checkAutoWatering();
    }

  if (schedMode == true ) {
    checkSchedules();
  }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

