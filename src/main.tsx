import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/yuji-syuku/japanese-400.css'
import '@fontsource/yuji-syuku/latin-400.css'
import '@fontsource/klee-one/japanese-400.css'
import '@fontsource/klee-one/latin-400.css'
import '@fontsource/ibm-plex-sans-jp/japanese-400.css'
import '@fontsource/ibm-plex-sans-jp/latin-400.css'
import '@fontsource/new-tegomin/japanese-400.css'
import '@fontsource/new-tegomin/latin-400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
