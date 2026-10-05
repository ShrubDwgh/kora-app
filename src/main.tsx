import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

document.documentElement.dataset.theme =
  localStorage.getItem('kora-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
