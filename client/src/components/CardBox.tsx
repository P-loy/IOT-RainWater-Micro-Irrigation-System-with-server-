import React from "react";
import { Card, ProgressBar, Spinner } from "react-bootstrap";

type Props = {
  title: string;
  value?: number;
  unit?: string;
  variant: string;
  loading?: boolean;
};

export default function CardBox({
  title,
  value,
  unit = "",
  variant,
  loading,
}: Props) {
  return (
    <Card className="h-100 shadow-lg border-0 rounded-4">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        {loading ? (
          <Spinner animation="border" />
        ) : (
          <>
            <h2 className={`text-${variant}`}>
              {value}
              {unit}
            </h2>
            <ProgressBar
              now={value}
              variant={variant}
              animated
              label={`${value}${unit}`}
            />
          </>
        )}
      </Card.Body>
    </Card>
  );
}
