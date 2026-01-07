import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Navbar,
  Nav,
  ProgressBar,
  Row,
  Form,
  Spinner,
  Toast,
  Dropdown,
} from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  AreaChart, // Changed to AreaChart for a "filling" water look
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Imports
import { rtdb } from "../firebaseConfig";
import { ref, onValue, set, push } from "firebase/database";

// 🎨 CUSTOM STYLES & FONTS
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

  body {
    background-color: #bdffc4; /* Soft Mint Cream */
    color: #2d3632ff;
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: #A7C4BC; border-radius: 10px; }

  /* Glassmorphism Card Style */
  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    border-radius: 24px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .glass-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12);
  }

  /* Floating Navbar */
  .floating-nav {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    margin-top: 20px;
    padding: 10px 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }

  .brand-text {
    background: -webkit-linear-gradient(45deg, #2d6a4f, #40916c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
  }

  .nav-active {
    color: #20c997 !important;
    font-weight: 700;
  }

  /* Custom Switch */
  .form-switch .form-check-input {
    width: 3em;
    height: 1.5em;
    background-color: #e9ecef;
    border-color: #dee2e6;
  }
  .form-switch .form-check-input:checked {
    background-color: #52b788;
    border-color: #52b788;
  }
`;

type Stats = {
  soilMoisture1: number;
  soilMoisture2: number;
  waterLevel: number;
  temperature: number;
  humidity: number;
  autoMode: boolean;
  schedMode?: boolean;
  relayStatus: boolean;
  lastWatered: string;
};

// Dummy data for charts
const dummyHistory = Array.from({ length: 12 }, (_, i) => ({
  time: `${i + 1}h`,
  moisture: Math.max(
    30,
    Math.min(90, 60 + Math.round((Math.random() - 0.5) * 20))
  ),
  level: Math.max(
    10,
    Math.min(100, 50 + Math.round((Math.random() - 0.5) * 30))
  ),
}));

// 🔹 Reusable StatCard Component (Updated Design)
const StatCard = ({ title, value, unit = "", icon, color }: any) => (
  <Card className="h-100 glass-card border-0">
    <Card.Body className="d-flex flex-column justify-content-between">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted fw-semibold small text-uppercase spacing-1">
          {title}
        </span>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      </div>

      {value === undefined || value === null ? (
        <Spinner animation="border" variant="success" size="sm" />
      ) : (
        <div>
          <h2 className="fw-bold mb-0" style={{ color: color }}>
            {value}
            <span className="fs-5 text-muted ms-1">{unit}</span>
          </h2>
          {unit === "%" && (
            <div
              className="progress mt-3"
              style={{
                height: "6px",
                borderRadius: "10px",
                backgroundColor: "#e9ecef",
              }}
            >
              <div
                className="progress-bar"
                style={{
                  width: `${value}%`,
                  backgroundColor: color,
                  borderRadius: "10px",
                  transition: "width 1s ease",
                }}
              />
            </div>
          )}
        </div>
      )}
    </Card.Body>
  </Card>
);

// 🔹 Modern Chart Component (Area Chart)
const ModernChart = ({ data, label, color, datakey }: any) => (
  <Card className="glass-card border-0 h-100">
    <Card.Body>
      <h5 className="fw-bold mb-4" style={{ color: "#2d3436" }}>
        {label}
      </h5>
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`color${datakey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#eee"
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#aaa", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey={datakey}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color${datakey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card.Body>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showWateringPopup, setShowWateringPopup] = useState(false);
  const [smPercent1Parameter, setSmPercent1Parameter] = useState<number>(20);
  const [smPercent2Parameter, setSmPercent2Parameter] = useState<number>(80);
  const [lastSoil1AlertTime, setLastSoil1AlertTime] = useState<number>(0);
  const [lastSoil2AlertTime, setLastSoil2AlertTime] = useState<number>(0);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Listen to settings for soil moisture thresholds
    const settingsRef = ref(rtdb, "esp/setting");
    const settingsUnsub = onValue(settingsRef, (snap) => {
      const d = snap.val();
      if (d) {
        setSmPercent1Parameter(d.smPercent1Parameter ?? 20);
        setSmPercent2Parameter(d.smPercent2Parameter ?? 80);
      }
    });

    // Firebase Listener - client sensors
    const sensorRef = ref(rtdb, "client/sensors");
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const soil1 = data.soilMoisture?.soil1 ?? 0;
        const soil2 = data.soilMoisture?.soil2 ?? 0;

        // Check soil moisture thresholds and log events
        if (
          soil1 <= smPercent1Parameter &&
          Date.now() - lastSoil1AlertTime > 60000
        ) {
          const timestamp = new Date().toISOString();
          const newEventRef = push(ref(rtdb, "events/soil_moisture"));
          set(newEventRef, {
            timestamp,
            type: "soil_1_low",
            value: soil1,
            threshold: smPercent1Parameter,
            message: `Soil 1 moisture ${soil1}% reached threshold ${smPercent1Parameter}%`,
          }).catch(console.error);
          setLastSoil1AlertTime(Date.now());
        }

        if (
          soil2 <= smPercent2Parameter &&
          Date.now() - lastSoil2AlertTime > 60000
        ) {
          const timestamp = new Date().toISOString();
          const newEventRef = push(ref(rtdb, "events/soil_moisture"));
          set(newEventRef, {
            timestamp,
            type: "soil_2_low",
            value: soil2,
            threshold: smPercent2Parameter,
            message: `Soil 2 moisture ${soil2}% reached threshold ${smPercent2Parameter}%`,
          }).catch(console.error);
          setLastSoil2AlertTime(Date.now());
        }

        setStats((prev) => ({
          soilMoisture1: soil1,
          soilMoisture2: soil2,
          waterLevel: data.ultrasonic?.waterTankPercent ?? 0,
          temperature: data.dht?.temperature ?? 0,
          humidity: data.dht?.humidity ?? 0,
          // preserve previous auto/sched if not present here
          autoMode: data.settings?.autoMode ?? prev?.autoMode ?? false,
          schedMode: prev?.schedMode ?? false,
          relayStatus: data.relay?.relayStatus ?? prev?.relayStatus ?? false,
          lastWatered: data.relay?.lastWatered ?? "Never",
        }));
      }
    });

    // Additional listener - esp relay for autoMode / schedMode
    const espRelayRef = ref(rtdb, "esp/sensors/relay");
    const unsubscribeEsp = onValue(espRelayRef, (snap) => {
      const d = snap.val();
      if (d) {
        setStats((prev) => ({
          soilMoisture1: prev?.soilMoisture1 ?? 0,
          soilMoisture2: prev?.soilMoisture2 ?? 0,
          waterLevel: prev?.waterLevel ?? 0,
          temperature: prev?.temperature ?? 0,
          humidity: prev?.humidity ?? 0,
          autoMode: d?.autoMode ?? prev?.autoMode ?? false,
          schedMode: d?.schedMode ?? prev?.schedMode ?? false,
          relayStatus: d?.relayStatus ?? prev?.relayStatus ?? false,
          lastWatered: prev?.lastWatered ?? "Never",
        }));

        // Log relay status change with timestamp
        const timestamp = new Date().toISOString();
        const newEventRef = push(ref(rtdb, "events/relay"));
        set(newEventRef, {
          timestamp,
          relayStatus: d.relayStatus,
          autoMode: d.autoMode,
          schedMode: d.schedMode,
          message: `Relay ${d.relayStatus ? "ON" : "OFF"}`,
        }).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeEsp();
      settingsUnsub();
      document.head.removeChild(styleSheet);
    };
  }, []);

  const showMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const onWaterNow = async () => {
    setLoading(true);
    const newState = !stats?.relayStatus;

    // optimistic update
    setStats((prev) => ({
      soilMoisture1: prev?.soilMoisture1 ?? 0,
      soilMoisture2: prev?.soilMoisture2 ?? 0,
      waterLevel: prev?.waterLevel ?? 0,
      temperature: prev?.temperature ?? 0,
      humidity: prev?.humidity ?? 0,
      autoMode: prev?.autoMode ?? false,
      schedMode: prev?.schedMode ?? false,
      relayStatus: newState,
      lastWatered: prev?.lastWatered ?? "Never",
    }));

    // show popup only when turning ON
    if (newState) setShowWateringPopup(true);

    try {
      await set(ref(rtdb, "esp/sensors/relay/relayStatus"), newState);
      showMessage(newState ? "💧 Pump turned ON" : "🛑 Pump turned OFF");
    } catch {
      showMessage("⚠️ Connection failed");
      // revert optimistic change
      setStats((prev) => ({
        soilMoisture1: prev?.soilMoisture1 ?? 0,
        soilMoisture2: prev?.soilMoisture2 ?? 0,
        waterLevel: prev?.waterLevel ?? 0,
        temperature: prev?.temperature ?? 0,
        humidity: prev?.humidity ?? 0,
        autoMode: prev?.autoMode ?? false,
        schedMode: prev?.schedMode ?? false,
        relayStatus: !newState,
        lastWatered: prev?.lastWatered ?? "Never",
      }));
    } finally {
      setLoading(false);
      if (!newState) setShowWateringPopup(false);
      if (newState) setTimeout(() => setShowWateringPopup(false), 2500);
    }
  };

  const onAutoMode = async () => {
    setAutoLoading(true);
    const newMode = !stats?.autoMode;

    // optimistic update so UI responds instantly
    setStats((prev) => ({
      soilMoisture1: prev?.soilMoisture1 ?? 0,
      soilMoisture2: prev?.soilMoisture2 ?? 0,
      waterLevel: prev?.waterLevel ?? 0,
      temperature: prev?.temperature ?? 0,
      humidity: prev?.humidity ?? 0,
      autoMode: newMode,
      schedMode: newMode ? false : prev?.schedMode ?? false,
      lastWatered: prev?.lastWatered ?? "Never",
      relayStatus: prev?.relayStatus ?? false,
    }));

    try {
      await set(ref(rtdb, "esp/sensors/relay/autoMode"), newMode);
      // if turning auto ON, ensure schedule is turned OFF on device
      if (newMode) {
        await set(ref(rtdb, "esp/sensors/relay/schedMode"), false);
      }
      showMessage(
        newMode
          ? "🌿 AI Auto Mode: ON (Schedule disabled)"
          : "🤖 Manual Control: ON"
      );
    } catch {
      showMessage("⚠️ Toggle failed");
      // revert optimistic change
      setStats((prev) => ({
        soilMoisture1: prev?.soilMoisture1 ?? 0,
        soilMoisture2: prev?.soilMoisture2 ?? 0,
        waterLevel: prev?.waterLevel ?? 0,
        temperature: prev?.temperature ?? 0,
        humidity: prev?.humidity ?? 0,
        autoMode: !newMode,
        schedMode: prev?.schedMode ?? false,
        lastWatered: prev?.lastWatered ?? "Never",
        relayStatus: prev?.relayStatus ?? false,
      }));
    } finally {
      setAutoLoading(false);
    }
  };

  const onSchedMode = async () => {
    setSchedLoading(true);
    const newMode = !stats?.schedMode;

    // optimistic update for immediate UI feedback
    setStats((prev) => ({
      soilMoisture1: prev?.soilMoisture1 ?? 0,
      soilMoisture2: prev?.soilMoisture2 ?? 0,
      waterLevel: prev?.waterLevel ?? 0,
      temperature: prev?.temperature ?? 0,
      humidity: prev?.humidity ?? 0,
      schedMode: newMode,
      autoMode: newMode ? false : prev?.autoMode ?? false,
      lastWatered: prev?.lastWatered ?? "Never",
      relayStatus: prev?.relayStatus ?? false,
    }));

    try {
      await set(ref(rtdb, "esp/sensors/relay/schedMode"), newMode);
      // if turning schedule ON, ensure auto is turned OFF on device
      if (newMode) {
        await set(ref(rtdb, "esp/sensors/relay/autoMode"), false);
      }
      showMessage(
        newMode
          ? "✅ Schedule Mode: ON (Auto disabled)"
          : "⚠️ Schedule Mode: OFF"
      );
    } catch {
      showMessage("⚠️ Toggle failed");
      // revert optimistic change
      setStats((prev) => ({
        soilMoisture1: prev?.soilMoisture1 ?? 0,
        soilMoisture2: prev?.soilMoisture2 ?? 0,
        waterLevel: prev?.waterLevel ?? 0,
        temperature: prev?.temperature ?? 0,
        humidity: prev?.humidity ?? 0,
        schedMode: !newMode,
        autoMode: prev?.autoMode ?? false,
        relayStatus: prev?.relayStatus ?? false,
        lastWatered: prev?.lastWatered ?? "Never",
      }));
    } finally {
      setSchedLoading(false);
    }
  };

  return (
    <>
      {/* 🧭 Modern Floating Navbar */}
      <Container>
        <Navbar expand="lg" className="floating-nav">
          <Container fluid>
            <Navbar.Brand className="brand-text fs-3">
              🌱 IOT-RWMIS
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center">
                <Nav.Link
                  as={Link}
                  to="/dashboard"
                  className={`mx-2 fw-semibold text-dark ${
                    location.pathname === "/dashboard" ? "nav-active" : ""
                  }`}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/schedules"
                  className={`mx-2 text-secondary ${
                    location.pathname === "/schedules" ? "nav-active" : ""
                  }`}
                >
                  Schedules
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/logs"
                  className={`mx-2 text-secondary ${
                    location.pathname === "/logs" ? "nav-active" : ""
                  }`}
                >
                  Logs
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/settings"
                  className={`mx-2 text-secondary ${
                    location.pathname === "/settings" ? "nav-active" : ""
                  }`}
                >
                  Setting
                </Nav.Link>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-3 rounded-pill px-4"
                  onClick={() => {
                    localStorage.removeItem("token");
                    nav("/login");
                  }}
                >
                  Logout
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </Container>

      <Container className="pb-5 mt-4">
        {/* 🌿 Hero Section: Plant Avatar & Health */}
        <Row className="justify-content-center mb-5">
          <Col md={8} className="text-center">
            <motion.div
              animate={{
                scale: (stats?.soilMoisture1 ?? 0) < 30 ? [1, 1.05, 1] : 1,
                rotate: (stats?.soilMoisture1 ?? 0) < 30 ? [0, -5, 5, 0] : 0,
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="d-inline-block p-5 rounded-circle shadow-sm bg-white mb-3"
              style={{
                width: "180px",
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "80px", lineHeight: 1 }}>
                {(stats?.soilMoisture1 ?? 0) < 30 ? "🥀" : "🌿"}
              </div>
            </motion.div>
            <h2 className="fw-bold text-dark">
              {(stats?.soilMoisture1 ?? 0) < 30
                ? "I'm thirsty!"
                : "I'm feeling great!"}
            </h2>
            <p className="text-muted">
              Your plant system is currently
              <span
                className={
                  stats?.autoMode
                    ? "text-success fw-bold"
                    : "text-warning fw-bold"
                }
              >
                {stats?.autoMode
                  ? " monitoring automatically"
                  : " in manual mode"}
              </span>
              .
            </p>
          </Col>
        </Row>

        {/* 📊 Bento Grid Stats */}
        <Row className="g-4">
          {/* Main Soil Sensor */}
          <Col md={4} lg={3}>
            <StatCard
              title="Soil Moisture 1"
              value={stats?.soilMoisture1}
              unit="%"
              icon="🌾"
              color="#52b788"
            />
          </Col>

          {/* Secondary Soil Sensor */}
          <Col md={4} lg={3}>
            <StatCard
              title="Soil Moisture 2"
              value={stats?.soilMoisture2}
              unit="%"
              icon="🌱"
              color="#52b788"
            />
          </Col>

          {/* Water Tank */}
          <Col md={4} lg={3}>
            <StatCard
              title="Water Tank"
              value={stats?.waterLevel}
              unit="%"
              icon="💧"
              color="#4895ef"
            />
          </Col>

          {/* Environment - Split Card */}
          <Col md={12} lg={3}>
            <div className="d-flex flex-column h-100 gap-3">
              <Card className="glass-card border-0 flex-grow-1 p-2 d-flex flex-row align-items-center justify-content-between px-4">
                <div>
                  <div className="text-muted small">TEMP</div>
                  <div className="fw-bold fs-4">{stats?.temperature}°C</div>
                </div>
                <div className="fs-1">🌡️</div>
              </Card>
              <Card className="glass-card border-0 flex-grow-1 p-2 d-flex flex-row align-items-center justify-content-between px-4">
                <div>
                  <div className="text-muted small">HUMIDITY</div>
                  <div className="fw-bold fs-4">{stats?.humidity}%</div>
                </div>
                <div className="fs-1">☁️</div>
              </Card>
            </div>
          </Col>
        </Row>

        {/* 🕹️ Controls & Actions */}
        <Row className="g-4 mt-2">
          <Col md={4}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onWaterNow}
              disabled={loading}
              className="w-100 h-100 border-0 rounded-4 shadow-sm text-white d-flex flex-column align-items-center justify-content-center p-4"
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              }}
            >
              {loading ? (
                <Spinner animation="border" variant="light" />
              ) : (
                <>
                  <span style={{ fontSize: "2rem" }}>💦</span>
                  <span className="fw-bold fs-5 mt-2">Water Now</span>
                  <span className="small text-white-50 mt-1">
                    Last: {stats?.lastWatered?.split(",")[1] || "Never"}
                  </span>
                </>
              )}
            </motion.button>
          </Col>

          <Col md={5}>
            <Card className="glass-card border-0 h-100 p-4">
              <h4 className="fw-bold mb-1">Intelligent Auto Mode</h4>
              <p className="text-muted mb-0 small">
                When enabled, the system waters automatically based on soil
                moisture levels below 30%.
              </p>
              <div className="d-flex align-items-center justify-content-between mt-3">
                <div>
                  <Form.Check
                    type="switch"
                    id="auto-mode"
                    checked={!!stats?.autoMode}
                    onChange={onAutoMode}
                    disabled={autoLoading}
                    className="d-inline-block fs-3"
                  />
                </div>
                <div>
                  <small className="text-muted">
                    Status: {stats?.autoMode ? "ON" : "OFF"}
                  </small>
                </div>
              </div>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="glass-card border-0 h-100 p-4">
              <Row className="align-items-center">
                <Col xs={8}>
                  <h5 className="fw-bold mb-1">Schedule Mode</h5>
                  <p className="text-muted mb-0 small">
                    Enable scheduled watering
                  </p>
                </Col>
                <Col xs={4} className="text-end">
                  <Form.Check
                    type="switch"
                    id="sched-mode"
                    checked={!!stats?.schedMode}
                    onChange={onSchedMode}
                    disabled={schedLoading}
                    className="d-inline-block fs-3"
                    aria-label="Schedule Mode"
                  />
                  <div className="mt-2">
                    <small className="text-muted">
                      {stats?.schedMode ? "ON" : "OFF"}
                    </small>
                  </div>
                </Col>
              </Row>

              <div className="text-end mt-3">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => nav("/schedules")}
                >
                  Manage
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 📈 Modern Charts - DISABLED
        <Row className="g-4 mt-2">
          <Col md={6}>
            <ModernChart
              data={dummyHistory}
              label="Soil Moisture Trends"
              color="#52b788"
              datakey="moisture"
            />
          </Col>
          <Col md={6}>
            <ModernChart
              data={dummyHistory}
              label="Water Usage History"
              color="#4895ef"
              datakey="level"
            />
          </Col>
        </Row>
        */}

        {/* 🔔 Notifications Toast */}
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={4000}
          autohide
          className="position-fixed bottom-0 end-0 m-4 border-0 shadow-lg rounded-4"
          style={{ background: "#333", color: "#fff", zIndex: 9999 }}
        >
          <Toast.Body className="d-flex align-items-center">
            <span className="me-2">📢</span> {toastMessage}
          </Toast.Body>
        </Toast>

        {/* 💧 Beautiful Full Screen Loader */}
        <AnimatePresence>
          {showWateringPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="d-flex justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100"
              style={{
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                zIndex: 9999,
              }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: "4rem" }}
                >
                  🌧️
                </motion.div>
                <h2 className="mt-4 fw-bold text-dark">
                  Watering Your Plants...
                </h2>
                <p className="text-muted">Sending signals to the relay pump.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
}
