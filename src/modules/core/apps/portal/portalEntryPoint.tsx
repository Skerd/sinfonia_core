import "./index.css";
import PortalApp from "./portalApp.tsx";
import {createRoot} from "react-dom/client";
import {env} from "@coreModule/helpers/environment/env.ts";

void env;

createRoot(document.getElementById("root")!).render(<PortalApp />);
