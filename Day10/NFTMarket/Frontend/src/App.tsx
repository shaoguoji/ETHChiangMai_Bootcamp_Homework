
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Market } from './pages/Market';
import { Profile } from './pages/Profile';
import { History } from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/market" element={<Market />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  )
}

export default App

