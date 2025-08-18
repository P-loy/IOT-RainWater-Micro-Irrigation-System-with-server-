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
import { fetchStats, toggleAutoMode, waterNow } from "../lib/api"; // ✅ fixed import
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Stats = {
  soilMoisture: number;
  waterLevel: number;
  temperature: number;
  autoMode: boolean;
  lastWatered: string; // ISO string from backend
};

// Dummy chart data
const dummyHistory = Array.from({ length: 12 }, (_, i) => ({
  time: `${i + 1}:00`,
  moisture: Math.max(
    30,
    Math.min(90, 60 + Math.round((Math.random() - 0.5) * 20))
  ),
  level: Math.max(
    10,
    Math.min(100, 50 + Math.round((Math.random() - 0.5) * 30))
  ),
}));

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showWateringPopup, setShowWateringPopup] = useState(false);
  const nav = useNavigate();

  const load = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      showMessage("⚠️ Cannot reach backend at http://127.0.0.1:8000");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const onWaterNow = async () => {
    setLoading(true);
    setShowWateringPopup(true);
    try {
      const res = await waterNow();
      showMessage(res.message || "💧 Watering triggered!");
      await load(); // refresh stats
    } finally {
      setLoading(false);
      setTimeout(() => setShowWateringPopup(false), 2500);
    }
  };

  const onAutoMode = async (newValue: boolean) => {
    setAutoLoading(true);
    try {
      const res = await toggleAutoMode();
      showMessage(res.message || "🌿 Auto mode toggled");
      setStats((prev) =>
        prev ? { ...prev, autoMode: res.autoMode ?? newValue } : prev
      );
    } catch (err) {
      setStats((prev) => (prev ? { ...prev, autoMode: !newValue } : prev));
      console.error("Failed to toggle auto mode:", err);
      showMessage("⚠️ Failed to toggle auto mode");
    } finally {
      setAutoLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const getProgressVariant = (type: "moisture" | "level", value: number) => {
    if (type === "moisture") {
      if (value < 30) return "danger";
      if (value < 60) return "warning";
      return "success";
    }
    if (type === "level") {
      if (value < 25) return "danger";
      if (value < 50) return "warning";
      return "info";
    }
    return "success";
  };

  const getPlantStyle = () => {
    if (!stats) return {};
    const size = 50 + stats.soilMoisture / 2;
    const color = stats.soilMoisture < 30 ? "#c62828" : "#2e7d32";
    return { fontSize: size, color, transition: "all 0.5s ease" };
  };

  return (
    <>
      {/* Navbar */}
      <Navbar
        bg="success"
        variant="dark"
        className="shadow-sm mb-4"
        style={{ background: "linear-gradient(90deg,#4caf50,#81c784)" }}
      >
        <Container>
          <Navbar.Brand className="fw-bold text-white">
            🌱 IOT Based Watering System
          </Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center gap-3">
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm">
                More Actions
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>📅 Set Up Schedule</Dropdown.Item>
                <Dropdown.Item disabled>🎛️ Customize</Dropdown.Item>
                <Dropdown.Item disabled>👤 Profile</Dropdown.Item>
                <Dropdown.Item disabled>⚙️ Settings</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="light" size="sm" onClick={logout}>
                Logout
              </Button>
            </motion.div>
          </Nav>
        </Container>
      </Navbar>

      <Container className="pb-5">
        {/* Plant Avatar */}
        <Row className="mb-4 justify-content-center text-center">
          <Col md={12}>
            <motion.div
              animate={getPlantStyle()}
              style={{ fontWeight: "bold" }}
            >
              🌿
            </motion.div>
            <div className="text-muted mt-2">Your plant's current health</div>
          </Col>
        </Row>

        {/* Stats Row */}
        <Row className="g-4">
          {/* Soil Moisture */}
          <Col md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="h-100 shadow-lg border-0 rounded-4">
                <Card.Body>
                  <Card.Title>🌾 Soil Moisture</Card.Title>
                  {stats === null ? (
                    <Spinner animation="border" />
                  ) : (
                    <>
                      <h2 className="text-success">{stats.soilMoisture}%</h2>
                      <ProgressBar
                        now={stats.soilMoisture}
                        variant={getProgressVariant(
                          "moisture",
                          stats.soilMoisture
                        )}
                        animated
                        label={`${stats.soilMoisture}%`}
                      />
                    </>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Water Tank */}
          <Col md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="h-100 shadow-lg border-0 rounded-4">
                <Card.Body>
                  <Card.Title>💧 Water Tank Level</Card.Title>
                  {stats === null ? (
                    <Spinner animation="border" />
                  ) : (
                    <>
                      <h2 className="text-info">{stats.waterLevel}%</h2>
                      <ProgressBar
                        now={stats.waterLevel}
                        variant={getProgressVariant("level", stats.waterLevel)}
                        animated
                        label={`${stats.waterLevel}%`}
                      />
                    </>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Temperature */}
          <Col md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="h-100 shadow-lg border-0 rounded-4">
                <Card.Body>
                  <Card.Title>🌡️ Temperature</Card.Title>
                  {stats === null ? (
                    <Spinner animation="border" />
                  ) : (
                    <h2 className="text-danger">{stats.temperature}°C</h2>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Controls Row */}
        <Row className="g-4 mt-1 d-flex align-items-stretch">
          {/* Auto Mode */}
          <Col md={6} className="d-flex">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="flex-fill"
            >
              <Card className="h-100 shadow-lg border-0 rounded-4 text-center">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <Card.Title>🤖 Auto Mode</Card.Title>
                  {stats === null ? (
                    <Spinner animation="border" />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center gap-3">
                      <Form.Check
                        type="switch"
                        id="auto-mode-switch"
                        label={stats?.autoMode ? "Enabled" : "Disabled"}
                        checked={!!stats?.autoMode}
                        disabled={autoLoading}
                        onChange={async () => {
                          const newValue = !stats?.autoMode;
                          setStats((prev) =>
                            prev ? { ...prev, autoMode: newValue } : prev
                          );
                          await onAutoMode(newValue);
                        }}
                        className="big-switch"
                      />
                      {autoLoading && (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="text-success"
                        />
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Water Now */}
          <Col md={6} className="d-flex">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="flex-fill"
            >
              <Card className="h-100 shadow-lg border-0 rounded-4 text-center">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <Card.Title>💦 Water Now</Card.Title>
                  <Button
                    onClick={onWaterNow}
                    disabled={loading}
                    variant="success"
                    className="px-4 py-2"
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />{" "}
                        Watering...
                      </>
                    ) : (
                      "💦 Water Now"
                    )}
                  </Button>
                  {stats && (
                    <div className="text-muted mt-2">
                      Last watered:{" "}
                      {stats.lastWatered
                        ? new Date(stats.lastWatered).toLocaleString()
                        : "Never"}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="g-4 mt-1">
          <Col md={6}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-success bg-opacity-75 text-white">
                  Moisture Trend
                </Card.Header>
                <Card.Body style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dummyHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="moisture"
                        stroke="#4caf50"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          <Col md={6}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-info bg-opacity-75 text-white">
                  Tank Level History
                </Card.Header>
                <Card.Body style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dummyHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="level"
                        stroke="#0288d1"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Toast */}
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={4000}
          autohide
          className="position-fixed bottom-0 end-0 m-3"
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>

        {/* Watering Popup */}
        <AnimatePresence>
          {showWateringPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.4)", // overlay
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
              }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "#4caf50",
                  color: "white",
                  padding: "2rem 3rem",
                  borderRadius: "1rem",
                  fontSize: "1.5rem",
                  textAlign: "center",
                  boxShadow: "0px 0px 25px rgba(0,0,0,0.4)",
                  minWidth: "300px",
                }}
              >
                <div className="mb-3">
                  <Spinner animation="border" role="status" variant="light" />
                </div>
                💦 Watering in Progress...
                <div
                  style={{
                    position: "relative",
                    height: "40px",
                    marginTop: "1rem",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1 + i * 0.2,
                        delay: i * 0.2,
                      }}
                      style={{
                        position: "absolute",
                        left: `${30 + i * 30}%`,
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#2196f3",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
}
