import React, { useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { login, register } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("Admin");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const res = await login(email, password);

        // Small animation before redirect
        setTimeout(() => {
          localStorage.setItem("token", res.token);
          nav("/dashboard");
        }, 600);
      } else {
        await register(name, email, password);
        setMsg("Registered! You can log in now.");
        setMode("login");
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #a8e063, #56ab2f)", // 🌿 green gradient
        backgroundSize: "cover",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-center mb-3 text-success fw-bold">
                    🌱 Smart Watering
                  </h3>
                  <p className="text-center text-muted mb-4">
                    {mode === "login"
                      ? "Sign in to continue"
                      : "Create your account"}
                  </p>

                  <Form onSubmit={submit}>
                    <AnimatePresence mode="wait">
                      {mode === "register" && (
                        <motion.div
                          key="nameField"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Form.Group className="mb-3" controlId="name">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </Form.Group>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    {msg && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-danger small text-center mb-2"
                      >
                        {msg}
                      </motion.div>
                    )}

                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        className="w-100 btn-success rounded-pill"
                        disabled={loading}
                      >
                        {loading
                          ? "Please wait…"
                          : mode === "login"
                          ? "Login"
                          : "Create account"}
                      </Button>
                    </motion.div>
                  </Form>

                  <div className="text-center mt-3">
                    {mode === "login" ? (
                      <Button
                        variant="link"
                        onClick={() => setMode("register")}
                        className="text-success"
                      >
                        No account? Register
                      </Button>
                    ) : (
                      <Button
                        variant="link"
                        onClick={() => setMode("login")}
                        className="text-success"
                      >
                        Have an account? Login
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
