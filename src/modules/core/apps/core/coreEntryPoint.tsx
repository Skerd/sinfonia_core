import './index.css'
import CoreApp from './coreApp.tsx'
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {env} from "@coreModule/helpers/env.ts";

void env;

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <CoreApp />
  // </StrictMode>,
)
