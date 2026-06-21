import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Pods from './pages/Pods'
import PodDetail from './pages/PodDetail'
import Deployments from './pages/Deployments'
import Services from './pages/Services'
import Nodes from './pages/Nodes'
import Namespaces from './pages/Namespaces'
import Events from './pages/Events'
import Clusters from './pages/Clusters'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="pods" element={<Pods />} />
        <Route path="namespaces/:namespace/pods/:name" element={<PodDetail />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="services" element={<Services />} />
        <Route path="nodes" element={<Nodes />} />
        <Route path="namespaces" element={<Namespaces />} />
        <Route path="events" element={<Events />} />
        <Route path="clusters" element={<Clusters />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
