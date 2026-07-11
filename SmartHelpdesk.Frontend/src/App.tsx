import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { Toaster } from './components/ui/toaster'
import { useEffect } from 'react'
import { signalRService } from './services/signalrService'
import './App.css'

function App() {
  useEffect(() => {
    signalRService.startConnection();
    return () => signalRService.stopConnection();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
