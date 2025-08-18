import React from "react";
import { Card, Form, Spinner } from "react-bootstrap";

type Props = {
  autoMode: boolean;
  autoLoading: boolean;
  onToggle: (newValue: boolean) => void;
};

export default function AutoModeCard({
  autoMode,
  autoLoading,
  onToggle,
}: Props) {
  return (
    <Card className="h-100 shadow-lg border-0 rounded-4">
      <Card.Body>
        <Card.Title>🌡️ Temperature</Card.Title>
        <h2 className="text-danger">--°C</h2>
        <div className="d-flex align-items-center gap-2 mt-2">
          <Form.Check
            type="switch"
            id="auto-mode-switch"
            label={autoMode ? "Enabled" : "Disabled"}
            checked={autoMode}
            disabled={autoLoading}
            onChange={() => onToggle(!autoMode)}
          />
          {autoLoading && <Spinner animation="border" size="sm" />}
        </div>
      </Card.Body>
    </Card>
  );
}
