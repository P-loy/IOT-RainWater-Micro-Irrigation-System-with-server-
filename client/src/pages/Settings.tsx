import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Navbar,
  Nav,
  Toast,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { rtdb } from "../firebaseConfig";
import { ref, onValue, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";

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
`;

type Settings = {
  autoMode?: boolean;
  moistureThreshold?: number;
  wateringDuration?: number;

  // Network
  wifi_ssid?: string;
  wifi_pass?: string;

  // Gmail notifications
  gmail_enabled?: boolean;
  gmail_email?: string;

  // UI / Units
  maxLengthButton?: boolean;
  liter?: number;
  mliter?: number;

  // Hardware / Timing
  maxValuePump?: number;
  readInterval?: number; // seconds (UI) — stored as milliseconds in RTDB
  waterTankParameter?: number;

  // Soil moisture calibration points
  smPercent1Parameter?: number;
  smPercent2Parameter?: number;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [maxLengthStatus, setMaxLengthStatus] = useState<boolean>(false);
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

  useEffect(() => {
    setLoading(true);
    const settingsRef = ref(rtdb, "esp/setting");
    const unsub = onValue(settingsRef, (snap) => {
      const d = snap.val();
      setSettings({
        autoMode: d?.autoMode ?? false,
        moistureThreshold: d?.moistureThreshold ?? 30,
        wateringDuration: d?.wateringDuration ?? 60,

        wifi_ssid: d?.wifi_ssid ?? "",
        wifi_pass: d?.wifi_pass ?? "",

        gmail_enabled: d?.gmail_enabled ?? false,
        gmail_email: d?.gmail_email ?? "",

        maxLengthButton: d?.maxLengthButton ?? true,
        liter: d?.liter ?? 0,
        mliter: d?.mliter ?? 0,

        maxValuePump: d?.maxValuePump ?? 100,
        // Store UI value as seconds; RTDB stores milliseconds so we convert here
        readInterval: d?.readInterval ? Math.round(d.readInterval / 1000) : 5,
        waterTankParameter: d?.waterTankParameter ?? 20,

        smPercent1Parameter: d?.smPercent1Parameter ?? 20,
        smPercent2Parameter: d?.smPercent2Parameter ?? 80,
      });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to maxLengthStatus from RTDB
  useEffect(() => {
    const maxLengthRef = ref(rtdb, "esp/sensors/ultrasonic/setmaxLenghtStatus");
    const unsub = onValue(maxLengthRef, (snap) => {
      const val = snap.val();
      if (val !== null) {
        setMaxLengthStatus(!!val);
      }
    });
    return () => unsub();
  }, []);

  // Toggle maxLengthStatus and write to RTDB
  const toggleMaxLength = async () => {
    try {
      const newValue = !maxLengthStatus;
      await set(
        ref(rtdb, "esp/sensors/ultrasonic/setmaxLenghtStatus"),
        newValue
      );
      setMaxLengthStatus(newValue);
    } catch (err) {
      console.error("Failed to toggle max length status:", err);
      setToast("⚠️ Failed to toggle max length");
    }
  };

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Convert readInterval (seconds in UI) -> milliseconds for RTDB
      // Exclude moistureThreshold, autoMode, wateringDuration, and maxLengthButton - they should not be sent to RTDB
      const {
        moistureThreshold,
        autoMode,
        wateringDuration,
        maxLengthButton,
        ...rest
      } = settings || {};
      const payload = {
        ...rest,
        readInterval: (settings?.readInterval ?? 5) * 1000,
      };
      await set(ref(rtdb, "esp/setting"), payload);

      // Log settings update event
      const timestamp = new Date().toISOString();
      await set(ref(rtdb, `events/settings_updated/${Date.now()}`), {
        timestamp,
        message: "System settings updated",
        changes: payload,
      });

      setToast("✅ Settings saved");
    } catch (err) {
      setToast("⚠️ Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (k: keyof Settings, v: any) => {
    setSettings((s) => ({ ...(s || {}), [k]: v }));
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
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="glass-card border-0 p-4">
              <h4 className="fw-bold mb-3">System Setting</h4>

              {loading || !settings ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : (
                <Form onSubmit={save}>
                  {/* Network - WiFi */}
                  <div className="mb-4 p-3 bg-white rounded-3 shadow-sm">
                    <h6 className="mb-2">WiFi</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>SSID</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.wifi_ssid}
                        onChange={(e) =>
                          handleChange("wifi_ssid", e.target.value)
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showWifiPass ? "text" : "password"}
                          value={settings.wifi_pass}
                          onChange={(e) =>
                            handleChange("wifi_pass", e.target.value)
                          }
                        />
                        <Button
                          variant={
                            showWifiPass ? "secondary" : "outline-secondary"
                          }
                          onClick={() => setShowWifiPass((s) => !s)}
                        >
                          {showWifiPass ? "Hide" : "Show"}
                        </Button>
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Toggle to reveal WiFi password when needed.
                      </Form.Text>
                    </Form.Group>
                  </div>

                  {/* Gmail */}
                  <div className="mb-4 p-3 bg-white rounded-3 shadow-sm">
                    <h6 className="mb-2">Gmail</h6>
                    <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <Form.Label className="mb-1">Enable Gmail</Form.Label>
                        <div className="text-muted small">
                          Send alerts via Gmail when enabled.
                        </div>
                      </div>
                      <Form.Check
                        type="switch"
                        id="gmail-enabled"
                        checked={!!settings.gmail_enabled}
                        onChange={(e) =>
                          handleChange("gmail_enabled", e.target.checked)
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>Gmail Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={settings.gmail_email}
                        placeholder="you@example.com (for make.com)"
                        onChange={(e) =>
                          handleChange("gmail_email", e.target.value)
                        }
                      />
                    </Form.Group>
                  </div>

                  {/* UI / Units */}
                  <div className="mb-4 p-3 bg-white rounded-3 shadow-sm">
                    <h6 className="mb-2">Units / Limits</h6>
                    <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <Form.Label className="mb-1">
                          Max Length Button
                        </Form.Label>
                        <div className="text-muted small">
                          Toggle ultrasonic max length status.
                        </div>
                      </div>
                      <Form.Check
                        type="switch"
                        id="max-length"
                        checked={maxLengthStatus}
                        onChange={toggleMaxLength}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Liters</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={settings.liter}
                        onChange={(e) =>
                          handleChange("liter", Number(e.target.value))
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>Milliliters</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={settings.mliter}
                        onChange={(e) =>
                          handleChange("mliter", Number(e.target.value))
                        }
                      />
                    </Form.Group>
                  </div>

                  {/* Hardware / Timing */}
                  <div className="mb-4 p-3 bg-white rounded-3 shadow-sm">
                    <h6 className="mb-2">Hardware</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Water Pump Max Output (L/h)</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={settings.maxValuePump}
                        onChange={(e) =>
                          handleChange("maxValuePump", Number(e.target.value))
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Read Interval (s)</Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        value={settings.readInterval}
                        onChange={(e) =>
                          handleChange("readInterval", Number(e.target.value))
                        }
                      />
                      <Form.Text className="text-muted">
                        Enter seconds; saved as milliseconds for the device.
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>Water Tank Alert Threshold (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        max={100}
                        value={settings.waterTankParameter}
                        onChange={(e) =>
                          handleChange(
                            "waterTankParameter",
                            Number(e.target.value)
                          )
                        }
                      />
                      <Form.Text className="text-muted">
                        Alert when water tank drops below this percentage.
                      </Form.Text>
                    </Form.Group>
                  </div>

                  {/* Soil moisture calibration */}
                  <div className="mb-4 p-3 bg-white rounded-3 shadow-sm">
                    <h6 className="mb-2">Soil Moisture Calibration</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>SM Percent 1</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        max={100}
                        value={settings.smPercent1Parameter}
                        onChange={(e) =>
                          handleChange(
                            "smPercent1Parameter",
                            Number(e.target.value)
                          )
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>SM Percent 2</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        max={100}
                        value={settings.smPercent2Parameter}
                        onChange={(e) =>
                          handleChange(
                            "smPercent2Parameter",
                            Number(e.target.value)
                          )
                        }
                      />
                    </Form.Group>
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      variant="success"
                      disabled={saving}
                      className="rounded-pill px-4"
                    >
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => window.location.reload()}
                      className="rounded-pill"
                    >
                      Reload
                    </Button>
                  </div>
                </Form>
              )}
            </Card>
          </Col>
        </Row>

        <Toast
          show={!!toast}
          onClose={() => setToast(null)}
          autohide
          delay={3000}
          className="position-fixed bottom-0 end-0 m-4 border-0 shadow-lg rounded-4"
          style={{ background: "#333", color: "#fff", zIndex: 9999 }}
        >
          <Toast.Body className="d-flex align-items-center">{toast}</Toast.Body>
        </Toast>
      </Container>
    </>
  );
}
