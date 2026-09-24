import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import App from "./App.jsx";

// a abertura parte sempre do topo: recarregar no meio da página não pode rodar a intro fora de quadro
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) scrollTo(0, 0);

createRoot(document.getElementById("root")).render(<App />);
