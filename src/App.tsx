import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Hub } from './routes/Hub'
import { Vectors } from './routes/topics/Vectors'
import { Functions } from './routes/topics/Functions'
import { Derivatives } from './routes/topics/Derivatives'
import { Integrals } from './routes/topics/Integrals'
import { Probability } from './routes/topics/Probability'
import { Expectation } from './routes/topics/Expectation'
import { Distributions } from './routes/topics/Distributions'
import { Matrices } from './routes/topics/Matrices'
import { Eigenvalues } from './routes/topics/Eigenvalues'
import { LinearRegression } from './routes/topics/LinearRegression'
import { Optimization } from './routes/topics/Optimization'
import { LogisticRegression } from './routes/topics/LogisticRegression'
import { Perceptron } from './routes/topics/Perceptron'
import { Backprop } from './routes/topics/Backprop'
import { Pca } from './routes/topics/Pca'
import { Clustering } from './routes/topics/Clustering'
import { Gmm } from './routes/topics/Gmm'
import { Embeddings } from './routes/topics/Embeddings'
import { Attention } from './routes/topics/Attention'
import { Diffusion } from './routes/topics/Diffusion'
import { Svm } from './routes/topics/Svm'
import { Convolutions } from './routes/topics/Convolutions'
import { Transformers } from './routes/topics/Transformers'
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
        <Route path="/integrals" element={<Integrals />} />
        <Route path="/probability" element={<Probability />} />
        <Route path="/expectation" element={<Expectation />} />
        <Route path="/distributions" element={<Distributions />} />
        <Route path="/matrices" element={<Matrices />} />
        <Route path="/eigenvalues" element={<Eigenvalues />} />
        <Route path="/linear-regression" element={<LinearRegression />} />
        <Route path="/optimization" element={<Optimization />} />
        <Route path="/logistic-regression" element={<LogisticRegression />} />
        <Route path="/perceptron" element={<Perceptron />} />
        <Route path="/backprop" element={<Backprop />} />
        <Route path="/pca" element={<Pca />} />
        <Route path="/clustering" element={<Clustering />} />
        <Route path="/gmm" element={<Gmm />} />
        <Route path="/embeddings" element={<Embeddings />} />
        <Route path="/attention" element={<Attention />} />
        <Route path="/diffusion" element={<Diffusion />} />
        <Route path="/svm" element={<Svm />} />
        <Route path="/transformers" element={<Transformers />} />
        <Route path="/convolutions" element={<Convolutions />} />
        <Route path="/recall" element={<Recall />} />
        <Route path="/__test-mdx" element={<TestMDX />} />
        <Route path="/__split-canvas-test" element={<SplitCanvasTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
