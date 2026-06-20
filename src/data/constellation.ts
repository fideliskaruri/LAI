export type TopicStatus = 'available' | 'coming-soon'

export type TopicPart = 'I' | 'II' | 'III' | 'IV'

export interface Topic {
  id: string
  number: number
  name: string
  /** Position in 1280×800 viewBox — hand-tuned per PLAN §4 */
  x: number
  y: number
  status: TopicStatus
  part: TopicPart
  prereqs: string[]
}

export const topics: Topic[] = [
  // Part I — Foundations (bottom-left cluster)
  { id: 'vectors', number: 1, name: 'Vectors', x: 150, y: 540, status: 'available', part: 'I', prereqs: [] },
  { id: 'functions', number: 2, name: 'Functions and change', x: 250, y: 380, status: 'available', part: 'I', prereqs: [] },
  { id: 'derivatives', number: 3, name: 'Derivatives', x: 380, y: 320, status: 'available', part: 'I', prereqs: ['functions'] },
  { id: 'integrals', number: 4, name: 'Integrals', x: 480, y: 390, status: 'available', part: 'I', prereqs: ['functions', 'derivatives'] },
  { id: 'matrices', number: 5, name: 'Matrices as transformations', x: 280, y: 590, status: 'available', part: 'I', prereqs: ['vectors'] },
  { id: 'eigenvalues', number: 6, name: 'Eigenvalues', x: 410, y: 640, status: 'available', part: 'I', prereqs: ['matrices'] },
  { id: 'probability', number: 7, name: 'Probability', x: 130, y: 680, status: 'available', part: 'I', prereqs: [] },
  { id: 'expectation', number: 8, name: 'Expectation & variance', x: 260, y: 720, status: 'available', part: 'I', prereqs: ['probability'] },
  { id: 'distributions', number: 9, name: 'Distributions', x: 400, y: 740, status: 'available', part: 'I', prereqs: ['probability', 'expectation', 'functions'] },

  // Part II — First Models (middle cluster)
  { id: 'linear-regression', number: 10, name: 'Linear regression', x: 580, y: 580, status: 'available', part: 'II', prereqs: ['vectors', 'matrices'] },
  { id: 'optimization', number: 11, name: 'Optimization', x: 670, y: 460, status: 'coming-soon', part: 'II', prereqs: ['derivatives', 'vectors', 'linear-regression'] },
  { id: 'logistic-regression', number: 12, name: 'Logistic regression', x: 690, y: 630, status: 'coming-soon', part: 'II', prereqs: ['linear-regression', 'probability', 'optimization'] },
  { id: 'perceptron', number: 13, name: 'Perceptron', x: 760, y: 580, status: 'coming-soon', part: 'II', prereqs: ['logistic-regression'] },
  { id: 'pca', number: 14, name: 'PCA', x: 550, y: 680, status: 'available', part: 'II', prereqs: ['eigenvalues', 'vectors', 'matrices'] },
  { id: 'clustering', number: 15, name: 'K-means', x: 620, y: 730, status: 'available', part: 'II', prereqs: ['vectors'] },
  { id: 'gmm', number: 16, name: 'Gaussian Mixtures', x: 760, y: 720, status: 'coming-soon', part: 'II', prereqs: ['clustering', 'distributions', 'optimization'] },
  { id: 'svm', number: 17, name: 'SVM', x: 850, y: 680, status: 'coming-soon', part: 'II', prereqs: ['vectors', 'matrices', 'optimization'] },

  // Part III — Neural Networks (middle-right cluster)
  { id: 'backprop', number: 18, name: 'MLP / Backprop', x: 850, y: 470, status: 'coming-soon', part: 'III', prereqs: ['perceptron', 'derivatives', 'matrices', 'optimization'] },
  { id: 'convolutions', number: 19, name: 'Convolutions', x: 930, y: 540, status: 'coming-soon', part: 'III', prereqs: ['backprop'] },
  { id: 'embeddings', number: 20, name: 'Word embeddings', x: 880, y: 350, status: 'coming-soon', part: 'III', prereqs: ['vectors', 'linear-regression', 'probability'] },
  { id: 'attention', number: 21, name: 'Attention', x: 970, y: 280, status: 'coming-soon', part: 'III', prereqs: ['vectors', 'distributions'] },
  { id: 'transformers', number: 22, name: 'Transformers', x: 1010, y: 200, status: 'coming-soon', part: 'III', prereqs: ['attention', 'backprop', 'embeddings'] },
  { id: 'language-models', number: 23, name: 'Language models', x: 1070, y: 130, status: 'coming-soon', part: 'III', prereqs: ['transformers', 'probability'] },

  // Part IV — Frontier (top-right)
  { id: 'rlhf', number: 24, name: 'RLHF', x: 1180, y: 180, status: 'coming-soon', part: 'IV', prereqs: ['language-models', 'optimization', 'probability'] },
  { id: 'diffusion', number: 25, name: 'Diffusion', x: 1150, y: 360, status: 'coming-soon', part: 'IV', prereqs: ['probability', 'distributions', 'optimization'] },
  { id: 'agents', number: 26, name: 'Agents', x: 1180, y: 80, status: 'coming-soon', part: 'IV', prereqs: ['language-models'] },
]
