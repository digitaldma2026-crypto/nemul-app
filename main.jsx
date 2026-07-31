import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

// Red de seguridad: si algo falla de forma inesperada en cualquier parte de
// la app, mostramos un mensaje amable en vez de dejar una pantalla en blanco.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "app_error", { message: String(error && error.message).slice(0, 150) });
      }
    } catch (e) {
      // nunca dejamos que el propio seguimiento de errores rompa nada más
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
            backgroundColor: "#F8F6F2",
            color: "#2E2A27",
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 500, marginBottom: 10 }}>Algo salió mal</p>
          <p style={{ fontSize: 14, color: "#6F6A64", marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
            No es culpa tuya. Intenta recargar la página; si el problema sigue, vuelve a intentarlo en unos minutos.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#6F5E4D",
              color: "#FFFFFF",
              padding: "12px 28px",
              borderRadius: 16,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
  </React.StrictMode>
);
