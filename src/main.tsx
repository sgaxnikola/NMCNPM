import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-[#E2E4F0] !bg-white/95 !shadow-lg !backdrop-blur-sm",
          title: "!text-[#1A1A2E] !font-semibold",
          description: "!text-[#717182]",
        },
      }}
    />
  </>
);
  