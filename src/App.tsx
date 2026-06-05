import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Calendar from './pages/Calendar';
import Trains from './pages/Trains';
import WorkPackages from './pages/WorkPackages';
import Dispatch from './pages/Dispatch';
import Quality from './pages/Quality';
import Materials from './pages/Materials';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="trains" element={<Trains />} />
          <Route path="work-packages" element={<WorkPackages />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="quality" element={<Quality />} />
          <Route path="materials" element={<Materials />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
