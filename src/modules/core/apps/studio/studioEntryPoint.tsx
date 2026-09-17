import './index.css'
import StudioApp from './studioApp.tsx'
import { createRoot } from 'react-dom/client'
import {env} from "@baseModule/helpers/environment/env.ts";

void env;

createRoot(document.getElementById('root')!).render(
    <StudioApp />
)
