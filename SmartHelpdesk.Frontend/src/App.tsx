import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { Toaster } from './components/ui/toaster'
import { useEffect } from 'react'
import { signalRService } from './services/signalrService'
import { useAuthStore } from './store/authStore'
import './App.css'

function App() {
  const authenticated = useAuthStore(s=>s.isAuthenticated);
  useEffect(() => {
    if(authenticated) signalRService.startConnection();
    return () => signalRService.stopConnection();
  }, [authenticated]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
