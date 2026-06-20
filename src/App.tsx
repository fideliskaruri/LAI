import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Hub } from './routes/Hub'
import { Vectors } from './routes/topics/Vectors'
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
        <Route path="/recall" element={<Recall />} />
        <Route path="/__test-mdx" element={<TestMDX />} />
        <Route path="/__split-canvas-test" element={<SplitCanvasTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
