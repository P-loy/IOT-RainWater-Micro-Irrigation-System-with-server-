import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { login, register } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("Admin");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
        background: "linear-gradient(135deg, #bdffc4)", // 🌿 green gradient
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
              <Card className="glass-card border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-center mb-3 brand-text fw-bold">
                    🌱 IOT-RWMIS
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
