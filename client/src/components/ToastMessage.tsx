import React from "react";
import { Toast } from "react-bootstrap";

type Props = {
  show: boolean;
  onClose: () => void;
  message: string | null;
  variant?: "success" | "danger" | "warning" | "info";
};

export default function ToastMessage({
  show,
  onClose,
  message,
  variant = "success",
}: Props) {
  return (
    <Toast
      show={show}
      onClose={onClose}
      delay={4000}
      autohide
      className="position-fixed bottom-0 end-0 m-3"
    >
      <Toast.Body className={`bg-${variant} text-white`}>{message}</Toast.Body>
    </Toast>
  );
}
