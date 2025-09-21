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
  Spinner,
  Toast,
  Table,
  Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

type Schedule = {
  id: number;
  start_time: string;
  duration: number;
  days_of_week?: string;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(0);
  const [daysOfWeek, setDaysOfWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/schedules");
      setSchedules(res.data);
    } catch (err) {
      showMessage("⚠️ Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const showMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  // Add Schedule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/schedules", {
        start_time: startTime,
        duration,
        days_of_week: daysOfWeek,
      });
      setSchedules((prev) => [...prev, res.data]);
      showMessage("✅ Schedule added");
      setStartTime("");
      setDuration(0);
      setDaysOfWeek("");
    } catch (err) {
      showMessage("⚠️ Failed to save schedule");
    }
  };

  // Open Edit Modal
  const handleEdit = (s: Schedule) => {
    setEditingSchedule(s);
    setShowEditModal(true);
  };

  // Update Schedule
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      const res = await api.put(
        `/schedules/${editingSchedule.id}`,
        editingSchedule
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSchedule.id ? res.data : s))
      );
      showMessage("✅ Schedule updated");
      setShowEditModal(false);
    } catch (err) {
      showMessage("⚠️ Failed to update schedule");
    }
  };

  // Delete Schedule
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showMessage("🗑️ Schedule deleted");
    } catch {
      showMessage("⚠️ Failed to delete schedule");
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
            📅 Watering Schedules
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
        </Container>
      </Navbar>

      <Container>
        <Row className="g-4">
          {/* Add Form Card */}
          <Col md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-success bg-opacity-75 text-white">
                  ➕ Add Schedule
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Days of Week</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Mon,Wed,Fri"
                        value={daysOfWeek}
                        onChange={(e) => setDaysOfWeek(e.target.value)}
                      />
                    </Form.Group>
                    <Button type="submit" variant="success" className="w-100">
                      Add
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
              <Card className="shadow-lg border-0 rounded-4">
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
                          <th>Duration</th>
                          <th>Days</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s) => (
                          <tr key={s.id}>
                            <td>{s.start_time}</td>
                            <td>{s.duration} mins</td>
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
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  value={editingSchedule?.duration || 0}
                  onChange={(e) =>
                    setEditingSchedule((prev) =>
                      prev
                        ? { ...prev, duration: Number(e.target.value) }
                        : prev
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
