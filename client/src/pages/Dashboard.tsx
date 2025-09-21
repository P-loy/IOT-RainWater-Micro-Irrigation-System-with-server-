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
import { fetchStats, toggleAutoMode, waterNow } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
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
  lastWatered: string;
};

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

// 🔹 Small reusable component for stat cards
const StatCard = ({ title, value, unit = "%", variant }: any) => (
  <Card className="h-100 shadow-lg border-0 rounded-4 text-center">
    <Card.Body>
      <Card.Title>{title}</Card.Title>
      {value === null ? (
        <Spinner animation="border" />
      ) : (
        <>
          <h2 className={`text-${variant}`}>
            {value}
            {unit}
          </h2>
          {unit === "%" && (
            <ProgressBar
              now={value}
              variant={variant}
              animated
              label={`${value}%`}
            />
          )}
        </>
      )}
    </Card.Body>
  </Card>
);

// 🔹 Chart component
const HistoryChart = ({ data, label, color, datakey }: any) => (
  <Card className="shadow-lg border-0 rounded-4">
    <Card.Header className={`text-white`} style={{ background: color }}>
      {label}
    </Card.Header>
    <Card.Body style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={datakey} stroke="#fff" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card.Body>
  </Card>
);

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
      setStats(await fetchStats());
    } catch {
      showMessage("⚠️ Cannot reach backend");
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
      await load();
    } finally {
      setLoading(false);
      setTimeout(() => setShowWateringPopup(false), 2500);
    }
  };

  const onAutoMode = async () => {
    setAutoLoading(true);
    try {
      const res = await toggleAutoMode();
      setStats((prev) => (prev ? { ...prev, autoMode: res.autoMode } : prev));
      showMessage(res.message || "🌿 Auto mode toggled");
    } catch {
      showMessage("⚠️ Failed to toggle auto mode");
    } finally {
      setAutoLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
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
            🌱 IOT Watering
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              🏠 Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/schedules">
              📅 Schedules
            </Nav.Link>
            <Nav.Link as={Link} to="/logs">
              📜 Logs
            </Nav.Link>
          </Nav>
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm">
                More
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>🎛️ Customize</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="light" size="sm" onClick={logout} className="ms-2">
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        {/* Plant Avatar */}
        <Row className="mb-4 text-center">
          <Col>
            <motion.div
              style={{
                fontSize: 50 + (stats?.soilMoisture ?? 0) / 2,
                color:
                  stats?.soilMoisture && stats.soilMoisture < 30
                    ? "#c62828"
                    : "#2e7d32",
                transition: "all 0.5s ease",
              }}
            >
              🌿
            </motion.div>
            <div className="text-muted">Your plant's current health</div>
          </Col>
        </Row>

        {/* Stats */}
        <Row className="g-4">
          <Col md={4}>
            <StatCard
              title="🌾 Soil Moisture"
              value={stats?.soilMoisture}
              variant="success"
            />
          </Col>
          <Col md={4}>
            <StatCard
              title="💧 Water Tank"
              value={stats?.waterLevel}
              variant="info"
            />
          </Col>
          <Col md={4}>
            <StatCard
              title="🌡️ Temperature"
              value={stats?.temperature}
              unit="°C"
              variant="danger"
            />
          </Col>
        </Row>

        {/* Controls */}
        <Row className="g-4 mt-1">
          <Col md={6}>
            <Card className="h-100 shadow-lg border-0 rounded-4 text-center">
              <Card.Body>
                <Card.Title>🤖 Auto Mode</Card.Title>
                <Form.Check
                  type="switch"
                  id="auto-mode"
                  label={stats?.autoMode ? "Enabled" : "Disabled"}
                  checked={!!stats?.autoMode}
                  disabled={autoLoading}
                  onChange={onAutoMode}
                />
                {autoLoading && <Spinner animation="border" size="sm" />}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 shadow-lg border-0 rounded-4 text-center">
              <Card.Body>
                <Card.Title>💦 Water Now</Card.Title>
                <Button
                  onClick={onWaterNow}
                  disabled={loading}
                  variant="success"
                >
                  {loading ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    "💦 Water Now"
                  )}
                </Button>
                <div className="text-muted mt-2">
                  Last watered:{" "}
                  {stats?.lastWatered
                    ? new Date(stats.lastWatered).toLocaleString()
                    : "Never"}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="g-4 mt-1">
          <Col md={6}>
            <HistoryChart
              data={dummyHistory}
              label="Moisture Trend"
              color="#4caf50"
              datakey="moisture"
            />
          </Col>
          <Col md={6}>
            <HistoryChart
              data={dummyHistory}
              label="Tank Level History"
              color="#0288d1"
              datakey="level"
            />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="d-flex justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100"
              style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
            >
              <div className="bg-success text-white p-4 rounded">
                <Spinner animation="border" role="status" variant="light" />
                <div>💦 Watering in Progress...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
}
