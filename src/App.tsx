import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Hub } from './routes/Hub'
import { Vectors } from './routes/topics/Vectors'
import { Functions } from './routes/topics/Functions'
import { Derivatives } from './routes/topics/Derivatives'
import { Probability } from './routes/topics/Probability'
import { Expectation } from './routes/topics/Expectation'
import { Matrices } from './routes/topics/Matrices'
import { Eigenvalues } from './routes/topics/Eigenvalues'
import { Pca } from './routes/topics/Pca'
import { Clustering } from './routes/topics/Clustering'
import { Recall } from './routes/Recall'
import { TestMDX } from './routes/__test/TestMDX'
import { SplitCanvasTest } from './routes/__test/SplitCanvasTest'
import { NotFound } from './components/ui/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/vectors" element={<Vectors />} />
        <Route path="/functions" element={<Functions />} />
        <Route path="/derivatives" element={<Derivatives />} />
        <Route path="/probability" element={<Probability />} />
        <Route path="/expectation" element={<Expectation />} />
        <Route path="/matrices" element={<Matrices />} />
        <Route path="/eigenvalues" element={<Eigenvalues />} />
        <Route path="/pca" element={<Pca />} />
        <Route path="/clustering" element={<Clustering />} />
        <Route path="/recall" element={<Recall />} />
        <Route path="/__test-mdx" element={<TestMDX />} />
        <Route path="/__split-canvas-test" element={<SplitCanvasTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
