type ValidationFeedbackProps = {
  message: string;
  type: "error" | "info";
};

export function ValidationFeedback({ message, type }: ValidationFeedbackProps) {
  return (
    <div className={`notice${type === "info" ? " loading" : ""}`} role={type === "error" ? "alert" : "status"}>
      {message}
    </div>
  );
}
