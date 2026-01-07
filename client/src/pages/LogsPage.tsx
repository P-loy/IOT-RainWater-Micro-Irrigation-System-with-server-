import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Navbar,
  Nav,
  Dropdown,
  Button,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { rtdb } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

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

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [soilEvents, setSoilEvents] = useState<any[]>([]);
  const [relayEvents, setRelayEvents] = useState<any[]>([]);
  const [schedEvents, setSchedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [waterTankPercent, setWaterTankPercent] = useState<number | null>(null);
  const [waterTankParameter, setWaterTankParameter] = useState<number>(20);
  const [waterTankAlert, setWaterTankAlert] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Listen to water tank percent from RTDB
  useEffect(() => {
    const waterTankRef = ref(rtdb, "client/sensors/waterTankPercent");
    const unsub = onValue(waterTankRef, (snap) => {
      const val = snap.val();
      if (val !== null) {
        setWaterTankPercent(val);
      }
    });
    return () => unsub();
  }, []);

  // Listen to water tank threshold from RTDB settings
  useEffect(() => {
    const settingsRef = ref(rtdb, "esp/setting/waterTankParameter");
    const unsub = onValue(settingsRef, (snap) => {
      const val = snap.val();
      if (val !== null) {
        setWaterTankParameter(val);
      }
    });
    return () => unsub();
  }, []);

  // Check if alert should be displayed
  useEffect(() => {
    if (waterTankPercent !== null && waterTankPercent < waterTankParameter) {
      setWaterTankAlert(true);
    } else {
      setWaterTankAlert(false);
    }
  }, [waterTankPercent, waterTankParameter]);

  // Listen to settings update events from RTDB
  useEffect(() => {
    const eventsRef = ref(rtdb, "events/settings_updated");
    const unsub = onValue(eventsRef, (snap) => {
      const val = snap.val();
      if (val) {
        const eventList = Object.entries(val)
          .map(([key, v]: [string, any]) => ({
            id: key,
            type: "settings_update",
            ...v,
          }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        setEvents(eventList);
      }
    });
    return () => unsub();
  }, []);

  // Listen to soil moisture threshold events
  useEffect(() => {
    const soilRef = ref(rtdb, "events/soil_moisture");
    const unsub = onValue(soilRef, (snap) => {
      const val = snap.val();
      if (val) {
        const eventList = Object.entries(val)
          .map(([key, v]: [string, any]) => ({
            id: key,
            type: "soil_moisture",
            ...v,
          }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        setSoilEvents(eventList);
      }
    });
    return () => unsub();
  }, []);

  // Listen to relay status events
  useEffect(() => {
    const relayRef = ref(rtdb, "events/relay");
    const unsub = onValue(relayRef, (snap) => {
      const val = snap.val();
      if (val) {
        const eventList = Object.entries(val)
          .map(([key, v]: [string, any]) => ({
            id: key,
            type: "relay",
            ...v,
          }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        setRelayEvents(eventList);
      }
    });
    return () => unsub();
  }, []);

  // Listen to schedule events
  useEffect(() => {
    const schedRef = ref(rtdb, "events/schedules");
    const unsub = onValue(schedRef, (snap) => {
      const val = snap.val();
      if (val) {
        const eventList = Object.entries(val)
          .map(([key, v]: [string, any]) => ({
            id: key,
            type: "schedule",
            ...v,
          }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        setSchedEvents(eventList);
      }
    });
    return () => unsub();
  }, []);

  // TODO: Re-enable Laravel backend connection later
  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   axios
  //     .get("http://127.0.0.1:8000/api/logs", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     })
  //     .then((res) => {
  //       setLogs(res.data);
  //       setLoading(false); // ✅ FIX: stop loading after success
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       setLoading(false); // ✅ FIX: stop loading even on error
  //     });
  // }, []);

  // Initialize loading as false since we're not fetching from backend yet
  useEffect(() => {
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  // Card entry animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
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
                  onClick={logout}
                >
                  Logout
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </Container>

      {/* Logs Table */}
      <Container className="pb-5 mt-4">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            {/* Water Tank Alert */}
            {waterTankAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-3"
              >
                <Alert variant="warning" className="mb-0 rounded-3">
                  <Alert.Heading className="mb-2">
                    ⚠️ Low Water Tank
                  </Alert.Heading>
                  <p className="mb-0">
                    Water tank level is at <strong>{waterTankPercent}%</strong>,
                    below the threshold of{" "}
                    <strong>{waterTankParameter}%</strong>. Please refill the
                    water tank.
                  </p>
                </Alert>
              </motion.div>
            )}

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="glass-card border-0">
                <Card.Header className="bg-success bg-opacity-75 text-white">
                  📜 Watering Logs
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="d-flex justify-content-center">
                      <Spinner animation="border" />
                    </div>
                  ) : events.length === 0 &&
                    soilEvents.length === 0 &&
                    relayEvents.length === 0 &&
                    schedEvents.length === 0 ? (
                    <div className="text-center text-muted">
                      No logs available yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Type</th>
                            <th>Details</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {/* Settings Update Events */}
                            {events.map((ev, idx) => (
                              <motion.tr
                                key={`event-${ev.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{
                                  backgroundColor: "rgba(33,150,243,0.1)",
                                  scale: 1.01,
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <strong>{idx + 1}</strong>
                                </td>
                                <td>⚙️ Settings</td>
                                <td>{ev.message}</td>
                                <td>
                                  {new Date(ev.timestamp).toLocaleString()}
                                </td>
                              </motion.tr>
                            ))}
                            {/* Soil Moisture Events */}
                            {soilEvents.map((ev, idx) => (
                              <motion.tr
                                key={`soil-${ev.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{
                                  backgroundColor: "rgba(255,152,0,0.1)",
                                  scale: 1.01,
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <strong>{events.length + idx + 1}</strong>
                                </td>
                                <td>🌱 Soil Low</td>
                                <td>
                                  {ev.type === "soil_1_low"
                                    ? `Soil 1: ${ev.value}% (threshold: ${ev.threshold}%)`
                                    : `Soil 2: ${ev.value}% (threshold: ${ev.threshold}%)`}
                                </td>
                                <td>
                                  {new Date(ev.timestamp).toLocaleString()}
                                </td>
                              </motion.tr>
                            ))}
                            {/* Relay Status Events */}
                            {relayEvents.map((ev, idx) => (
                              <motion.tr
                                key={`relay-${ev.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{
                                  backgroundColor: "rgba(76,175,80,0.1)",
                                  scale: 1.01,
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <strong>
                                    {events.length +
                                      soilEvents.length +
                                      idx +
                                      1}
                                  </strong>
                                </td>
                                <td>⚡ Relay</td>
                                <td>{ev.message}</td>
                                <td>
                                  {new Date(ev.timestamp).toLocaleString()}
                                </td>
                              </motion.tr>
                            ))}
                            {/* Schedule Events */}
                            {schedEvents.map((ev, idx) => (
                              <motion.tr
                                key={`sched-${ev.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{
                                  backgroundColor: "rgba(156,39,176,0.1)",
                                  scale: 1.01,
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <strong>
                                    {events.length +
                                      soilEvents.length +
                                      relayEvents.length +
                                      idx +
                                      1}
                                  </strong>
                                </td>
                                <td>📅 Schedule {ev.action?.toUpperCase()}</td>
                                <td>{ev.message}</td>
                                <td>
                                  {new Date(ev.timestamp).toLocaleString()}
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
