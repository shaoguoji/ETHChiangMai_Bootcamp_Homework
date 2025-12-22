
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Market } from './pages/Market';
import { Profile } from './pages/Profile';
import { History } from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Market />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  )
}

export default App

