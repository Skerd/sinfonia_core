import './index.css'
import StudioApp from './studioApp.tsx'
import { createRoot } from 'react-dom/client'
import {env} from "@coreModule/helpers/env.ts";

void env;

createRoot(document.getElementById('root')!).render(
    <StudioApp />
)
