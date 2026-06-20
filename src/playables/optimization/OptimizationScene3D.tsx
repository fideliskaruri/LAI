import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The 3D loss landscape for the Optimization chapter. Same surface as the
 * NonConvex act: f(x, y) = x⁴ − 2x² + y². Two basins at (±1, 0) and a
 * saddle at the origin.
 *
 * A vermilion ball auto-traces a gradient descent path starting from a
 * fixed seed location, animating one step per ~250ms. When the ball
 * settles into a basin the camera continues to orbit; on `prefers-
 * reduced-motion`, both the camera orbit and the ball animation freeze
 * at a viewing angle, mirroring the policy in NDLeapScene3D.
 */

const Z_SCALE = 0.35

function f(x: number, y: number) {
  return x * x * x * x - 2 * x * x + y * y
}
function gradF(x: number, y: number) {
  return { gx: 4 * x * x * x - 4 * x, gy: 2 * y }
}

const START = { x: -1.55, y: 0.9 }
const ETA = 0.05
const STEPS = 80

function precomputeTrajectory() {
  const path: Array<[number, number, number]> = []
  let x = START.x
  let y = START.y
  for (let i = 0; i < STEPS; i++) {
    path.push([x, y, f(x, y) * Z_SCALE])
    const { gx, gy } = gradF(x, y)
    x = x - ETA * gx
    y = y - ETA * gy
  }
  return path
}

export default function OptimizationScene3D() {
  return (
    <div className="aspect-[5/4] w-full">
      <Canvas
        camera={{ position: [2.6, 2.4, 3.4], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={0.65} />
        <directionalLight position={[-3, 2, -1]} intensity={0.25} />
        <LandscapeMesh />
        <BasinMarkers />
        <DescentBall />
        <SlowOrbit />
      </Canvas>
    </div>
  )
}

function LandscapeMesh() {
  const RES = 64
  const X_HALF = 1.7
  const Y_HALF = 1.2

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(X_HALF * 2, Y_HALF * 2, RES, RES)
    const pos = geom.attributes.position
    // PlaneGeometry is in the XY plane with z = 0. We rewrite z = f(x, y).
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i, f(x, y) * Z_SCALE)
    }
    geom.computeVertexNormals()
    return geom
  }, [])

  // Rotate the plane so Y becomes vertical in the world: −π/2 about the X-axis
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color="#E2D4C2"
        metalness={0.05}
        roughness={0.85}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  )
}

function BasinMarkers() {
  // Small ink spheres at the two minima (±1, 0).
  return (
    <group>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx, f(sx, 0) * Z_SCALE - 0.005, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#ECE4D2" />
        </mesh>
      ))}
    </group>
  )
}

function DescentBall() {
  const ballRef = useRef<THREE.Mesh | null>(null)
  const trailRef = useRef<THREE.Line | null>(null)

  const trajectory = useMemo(() => precomputeTrajectory(), [])

  // Build the trail geometry once and reveal vertices as the animation
  // progresses by clamping draw range.
  const trailGeometry = useMemo(() => {
    const pts = trajectory.map(([x, y, z]) => new THREE.Vector3(x, z + 0.01, -y))
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    geom.setDrawRange(0, 1)
    return geom
  }, [trajectory])

  const reducedMotionRef = useRef<boolean>(
    typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        (typeof document !== 'undefined' &&
          document.documentElement.dataset.reducedMotion === 'true')),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compute = () => {
      reducedMotionRef.current =
        mql.matches ||
        (typeof document !== 'undefined' &&
          document.documentElement.dataset.reducedMotion === 'true')
    }
    compute()
    mql.addEventListener('change', compute)
    return () => mql.removeEventListener('change', compute)
  }, [])

  useFrame(({ clock }: RootState) => {
    // In reduced-motion mode, freeze the ball near the end of the trajectory
    // so the resting state is visible (the basin), and skip the orbit.
    if (reducedMotionRef.current) {
      const last = trajectory[trajectory.length - 1]
      if (ballRef.current) ballRef.current.position.set(last[0], last[2] + 0.06, -last[1])
      trailGeometry.setDrawRange(0, trajectory.length)
      return
    }
    const t = clock.getElapsedTime()
    // 0.3s per step; loop after 6s rest beyond the final step.
    const STEP_SEC = 0.18
    const TOTAL = trajectory.length * STEP_SEC + 4
    const tau = t % TOTAL
    const i = Math.min(trajectory.length - 1, Math.floor(tau / STEP_SEC))
    const next = Math.min(trajectory.length - 1, i + 1)
    const localFrac = Math.min(1, (tau - i * STEP_SEC) / STEP_SEC)
    const a = trajectory[i]
    const b = trajectory[next]
    const x = a[0] + (b[0] - a[0]) * localFrac
    const y = a[1] + (b[1] - a[1]) * localFrac
    const z = a[2] + (b[2] - a[2]) * localFrac
    if (ballRef.current) ballRef.current.position.set(x, z + 0.06, -y)
    trailGeometry.setDrawRange(0, i + 1)
  })

  return (
    <group>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshStandardMaterial color="#C44536" metalness={0.1} roughness={0.55} />
      </mesh>
      <primitive
        ref={trailRef}
        object={
          new THREE.Line(
            trailGeometry,
            new THREE.LineBasicMaterial({ color: 0xc44536, transparent: true, opacity: 0.7 }),
          )
        }
      />
    </group>
  )
}

function SlowOrbit() {
  const reducedMotionRef = useRef<boolean>(
    typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        (typeof document !== 'undefined' &&
          document.documentElement.dataset.reducedMotion === 'true')),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compute = () => {
      reducedMotionRef.current =
        mql.matches ||
        (typeof document !== 'undefined' &&
          document.documentElement.dataset.reducedMotion === 'true')
    }
    compute()
    mql.addEventListener('change', compute)
    return () => mql.removeEventListener('change', compute)
  }, [])

  useFrame(({ camera, clock }: RootState) => {
    const appPref =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.reducedMotion === 'true'
    if (reducedMotionRef.current || appPref) {
      camera.position.set(2.6, 2.4, 3.4)
      camera.lookAt(0, 0, 0)
      return
    }
    const t = clock.getElapsedTime()
    const r = 4.2
    camera.position.x = Math.cos(t * 0.1) * r
    camera.position.z = Math.sin(t * 0.1) * r
    camera.position.y = 2.6
    camera.lookAt(0, 0, 0)
  })
  return null
}
