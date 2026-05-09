import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DiscordProvider } from './context/DiscordContext'
import { GoogleProvider } from './context/GoogleContext'
import { LinkedInProvider } from './context/LinkedInContext'
import LandingPage from './pages/LandingPage'
import Signup from './pages/Signup'
import Login from './pages/Login'
import DiscordCallback from './pages/DiscordCallback'
import GoogleCallback from './pages/GoogleCallback'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './dashboard/DashboardLayout'
import DashboardHome from './dashboard/DashboardHome'
import ArchivePage from './dashboard/ArchivePage'
import InsightsPage from './dashboard/InsightsPage'
import DigestPage from './dashboard/DigestPage'
import NotificationsPage from './dashboard/NotificationsPage'
import ProfilePage from './dashboard/ProfilePage'

function App() {
  return (
    <ThemeProvider>
    <DiscordProvider>
    <GoogleProvider>
    <LinkedInProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/discord/callback" element={<DiscordCallback />} />
        <Route path="/google/callback" element={<GoogleCallback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="digest" element={<DigestPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LinkedInProvider>
    </GoogleProvider>
    </DiscordProvider>
    </ThemeProvider>
  )
}

// also anyone should be able to connect its chats and my task is to make it sumarizr identify important things means ll the things presetn in dashaord  should be done
export default App
