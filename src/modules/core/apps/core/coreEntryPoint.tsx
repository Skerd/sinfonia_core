import './index.css'
import CoreApp from './coreApp.tsx'
import { createRoot } from 'react-dom/client'
import {env} from "@coreModule/helpers/environment/env.ts";

void env;

createRoot(document.getElementById('root')!).render(
  <CoreApp />,
)
