import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Hub } from './routes/Hub'
import { Vectors } from './routes/topics/Vectors'
import { TestMDX } from './routes/__test/TestMDX'
import { NotFound } from './components/ui/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/vectors" element={<Vectors />} />
        <Route path="/__test-mdx" element={<TestMDX />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
