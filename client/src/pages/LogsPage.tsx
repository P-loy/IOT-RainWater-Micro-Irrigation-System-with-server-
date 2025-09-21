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
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://127.0.0.1:8000/api/logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setLogs(res.data);
        setLoading(false); // ✅ FIX: stop loading after success
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // ✅ FIX: stop loading even on error
      });
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

          {/* Navigation links */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              🏠 Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/schedules">
              📅 Schedules
            </Nav.Link>
            <Nav.Link as={Link} to="/logs" active>
              📜 Logs
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto d-flex align-items-center gap-3">
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm">
                More Actions
              </Dropdown.Toggle>
              <Dropdown.Menu>
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

      {/* Logs Table */}
      <Container className="pb-5">
        <Row className="justify-content-center">
          <Col md={12}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-success bg-opacity-75 text-white">
                  📜 Watering Logs
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="d-flex justify-content-center">
                      <Spinner animation="border" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center text-muted">
                      No logs available yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead>
                          <tr>
                            <th>Started</th>
                            <th>Ended</th>
                            <th>Soil Moisture (Before → After)</th>
                            <th>Water Level (Before → After)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {logs.map((l) => (
                              <motion.tr
                                key={l.id}
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
                                  {l.started_at
                                    ? new Date(l.started_at).toLocaleString()
                                    : "—"}
                                </td>
                                <td>
                                  {l.ended_at
                                    ? new Date(l.ended_at).toLocaleString()
                                    : "—"}
                                </td>
                                <td>
                                  {l.soil_moisture_before}%{" → "}
                                  {l.soil_moisture_after}%
                                </td>
                                <td>
                                  {l.water_level_before}%{" → "}
                                  {l.water_level_after}%
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
