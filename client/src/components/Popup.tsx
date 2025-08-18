import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  show: boolean;
  message: string;
};

export default function Popup({ show, message }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 9998,
          }}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "#4caf50",
              color: "white",
              padding: "2rem 3rem",
              borderRadius: "1rem",
              fontSize: "1.5rem",
              textAlign: "center",
              boxShadow: "0px 0px 25px rgba(0,0,0,0.4)",
            }}
          >
            {message}
            <div
              style={{
                position: "relative",
                height: "40px",
                marginTop: "1rem",
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1 + i * 0.2,
                    delay: i * 0.2,
                  }}
                  style={{
                    position: "absolute",
                    left: `${30 + i * 30}%`,
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#2196f3",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
