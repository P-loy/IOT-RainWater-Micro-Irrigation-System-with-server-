import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Navbar,
  Nav,
  Row,
  Form,
  InputGroup,
  Spinner,
  Toast,
  Table,
  Modal,
} from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { rtdb } from "../firebaseConfig";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { motion } from "framer-motion";

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

type Schedule = {
  id: string;
  start_time: string;
  days_of_week?: string;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [startTime, setStartTime] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const location = useLocation();
  const nav = useNavigate();

  // We'll use Firebase RTDB for schedule storage (esp/schedules)

  // Listen for schedules in RTDB (esp/schedules)
  useEffect(() => {
    setLoading(true);
    const schedulesRef = ref(rtdb, "esp/schedules");
    const unsub = onValue(
      schedulesRef,
      (snapshot) => {
        const val = snapshot.val();
        const list: Schedule[] = [];
        if (val) {
          Object.entries(val).forEach(([key, v]) => {
            const s: any = v as any;
            list.push({
              id: key,
              start_time: s.start_time,
              days_of_week: s.days_of_week ?? "",
            });
          });
        }
        setSchedules(list);
        setLoading(false);
      },
      (err) => {
        console.error("RTDB listen error", err);
        showMessage("⚠️ Failed to load schedules from RTDB");
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, []);

  const showMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  // Helper to toggle a weekday in comma-separated daysOfWeek
  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) => {
      const arr = prev
        ? prev
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const idx = arr.indexOf(day);
      if (idx === -1) arr.push(day);
      else arr.splice(idx, 1);
      return arr.join(",");
    });
  };

  // Add Schedule -> write directly to RTDB under esp/schedules with numeric id starting at 1
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const schedulesRef = ref(rtdb, "esp/schedules");
      // Determine next numeric ID (1-based)
      const snap = await get(schedulesRef);
      let nextId = "1";
      if (snap.exists()) {
        const val: Record<string, any> = snap.val();
        const nums = Object.keys(val)
          .map((k) => parseInt(k, 10))
          .filter((n) => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        nextId = String(max + 1);
      }

      const payload = { start_time: startTime, days_of_week: daysOfWeek };
      await set(ref(rtdb, `esp/schedules/${nextId}`), payload);
      showMessage("✅ Schedule added to RTDB");

      // Log event
      const timestamp = new Date().toISOString();
      await set(ref(rtdb, `events/schedules/${Date.now()}`), {
        timestamp,
        action: "add",
        scheduleId: nextId,
        schedule: payload,
        message: `Schedule ${nextId} added (${startTime})`,
      });

      // Clear form
      setStartTime("");
      setDaysOfWeek("");
    } catch (err) {
      console.error("Failed to write schedule to RTDB", err);
      showMessage("⚠️ Failed to save schedule to RTDB");
    } finally {
      setAddLoading(false);
    }
  };

  // ---------- UI: Improved Add Schedule Form ----------
  // Replaces existing form markup with grouped time/duration and weekday buttons
  // (Markup change below in the Add Form Card)

  // Open Edit Modal
  const handleEdit = (s: Schedule) => {
    setEditingSchedule(s);
    setShowEditModal(true);
  };

  // Update Schedule in RTDB
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      const payload = {
        start_time: editingSchedule.start_time,
        days_of_week: editingSchedule.days_of_week ?? "",
      };
      await update(ref(rtdb, `esp/schedules/${editingSchedule.id}`), payload);
      showMessage("✅ Schedule updated in RTDB");

      // Log event
      const timestamp = new Date().toISOString();
      await set(ref(rtdb, `events/schedules/${Date.now()}`), {
        timestamp,
        action: "edit",
        scheduleId: editingSchedule.id,
        schedule: payload,
        message: `Schedule ${editingSchedule.id} updated (${editingSchedule.start_time})`,
      });

      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update schedule in RTDB", err);
      showMessage("⚠️ Failed to update schedule");
    }
  };

  // Delete Schedule from RTDB
  const handleDelete = async (id: string) => {
    try {
      await remove(ref(rtdb, `esp/schedules/${id}`));
      showMessage("🗑️ Schedule deleted from RTDB");

      // Log event
      const timestamp = new Date().toISOString();
      await set(ref(rtdb, `events/schedules/${Date.now()}`), {
        timestamp,
        action: "delete",
        scheduleId: id,
        message: `Schedule ${id} deleted`,
      });
    } catch (err) {
      console.error("Failed to delete schedule in RTDB", err);
      showMessage("⚠️ Failed to delete schedule");
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
        <Row className="g-4 justify-content-center">
          {/* Add Form Card */}
          <Col md={4} lg={3}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="glass-card border-0">
                <Card.Header className="bg-success bg-opacity-75 text-white">
                  ➕ Add Schedule
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>⏰</InputGroup.Text>
                      <Form.Control
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </InputGroup>

                    <div className="mb-3">
                      <Form.Label>Days</Form.Label>
                      <div className="d-flex gap-2 flex-wrap mt-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (d) => (
                            <Button
                              key={d}
                              size="sm"
                              variant={
                                daysOfWeek
                                  .split(",")
                                  .map((s) => s.trim())
                                  .includes(d)
                                  ? "success"
                                  : "outline-secondary"
                              }
                              onClick={() => toggleDay(d)}
                            >
                              {d}
                            </Button>
                          )
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        Select days (leave empty for every day)
                      </Form.Text>
                    </div>

                    <Button
                      type="submit"
                      variant="success"
                      className="w-100"
                      disabled={addLoading}
                    >
                      {addLoading ? (
                        <>
                          <Spinner animation="border" size="sm" />{" "}
                          <span className="ms-2">Adding...</span>
                        </>
                      ) : (
                        "Add Schedule"
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* List Card */}
          <Col md={8}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="glass-card border-0">
                <Card.Header className="bg-info bg-opacity-75 text-white">
                  Existing Schedules
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" />
                    </div>
                  ) : schedules.length === 0 ? (
                    <p className="text-muted">No schedules yet.</p>
                  ) : (
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Start Time</th>
                          <th>Days</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s) => (
                          <tr key={s.id}>
                            <td>{s.start_time}</td>
                            <td>{s.days_of_week || "Any"}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(s)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(s.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>✏️ Edit Schedule</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUpdate}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={editingSchedule?.start_time || ""}
                  onChange={(e) =>
                    setEditingSchedule((prev) =>
                      prev ? { ...prev, start_time: e.target.value } : prev
                    )
                  }
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Days of Week</Form.Label>
                <Form.Control
                  type="text"
                  value={editingSchedule?.days_of_week || ""}
                  onChange={(e) =>
                    setEditingSchedule((prev) =>
                      prev ? { ...prev, days_of_week: e.target.value } : prev
                    )
                  }
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Toast */}
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          className="position-fixed bottom-0 end-0 m-3"
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </Container>
    </>
  );
}
