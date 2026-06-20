import { useEffect, useRef, type ReactElement } from 'react'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The 3D projection scene for the projection-interpretation act.
 *
 * What's drawn:
 *  - A flat plane through the origin — the column space of X (i.e. all
 *    vectors of the form Xβ for some β).
 *  - A vermilion arrow from the origin to a point ABOVE the plane — that's
 *    the observed response y. It does NOT lie in the column space.
 *  - A grey arrow from the origin to the foot of the perpendicular from y
 *    to the plane — that's the projection ŷ = Xβ̂, the best fit.
 *  - A pale dashed segment from y down to ŷ — the residual r = y − ŷ. It's
 *    perpendicular to the plane; that perpendicularity IS the least-squares
 *    condition.
 *
 * The camera orbits slowly so the reader's eye registers that the residual
 * is perpendicular to the plane in 3D, not just in a frozen 2D snapshot.
 *
 * Lazy-loaded by the parent act so the three.js bundle doesn't ship with
 * the rest of the chapter.
 */

export default function LinRegProjectionScene3D() {
  return (
    <div className="w-full aspect-[5/4]">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 6, 4]} intensity={0.5} />
        <ColumnSpacePlane />
        <Arrow
          from={[0, 0, 0]}
          to={[2.1, 1.6, 0.5]}
          colour="#C44536"
          label="y"
          thick={0.028}
        />
        <Arrow
          from={[0, 0, 0]}
          to={[2.1, 0, 0.5]}
          colour="#6B6B6B"
          label="Xβ̂"
          thick={0.022}
        />
        <ResidualSegment from={[2.1, 1.6, 0.5]} to={[2.1, 0, 0.5]} />
        <RightAngleTick position={[2.1, 0, 0.5]} />
        <SlowOrbit />
      </Canvas>
    </div>
  )
}

function ColumnSpacePlane() {
  // A 4×4 plane in the xz-plane at y=0. Rendered as a single mesh with
  // very low opacity so the arrows on/above it stay legible. A faint grid
  // is overlaid via a line set so the reader registers "this is a 2D
  // subspace, not a featureless slab".
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial
          color="#C44536"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <PlaneGrid />
    </group>
  )
}

function PlaneGrid() {
  // Build a grid of lines on the xz plane manually for tight control.
  const lines: ReactElement[] = []
  const STEP = 0.5
  const HALF = 2
  for (let i = -HALF; i <= HALF; i += STEP) {
    const a = new THREE.Vector3(-HALF, 0, i)
    const b = new THREE.Vector3(HALF, 0, i)
    const c = new THREE.Vector3(i, 0, -HALF)
    const d = new THREE.Vector3(i, 0, HALF)
    lines.push(<Line key={`a-${i}`} a={a} b={b} colour="#C44536" opacity={0.22} />)
    lines.push(<Line key={`b-${i}`} a={c} b={d} colour="#C44536" opacity={0.22} />)
  }
  return <group>{lines}</group>
}

function Line({
  a,
  b,
  colour = '#1A1A1A',
  opacity = 1,
}: {
  a: THREE.Vector3
  b: THREE.Vector3
  colour?: string
  opacity?: number
}) {
  const geom = new THREE.BufferGeometry().setFromPoints([a, b])
  const mat = new THREE.LineBasicMaterial({
    color: colour,
    transparent: opacity < 1,
    opacity,
  })
  return <primitive object={new THREE.Line(geom, mat)} />
}

function Arrow({
  from,
  to,
  colour,
  label: _label,
  thick = 0.022,
}: {
  from: [number, number, number]
  to: [number, number, number]
  colour: string
  label?: string
  thick?: number
}) {
  const fromV = new THREE.Vector3(...from)
  const toV = new THREE.Vector3(...to)
  const dir = new THREE.Vector3().subVectors(toV, fromV)
  const length = dir.length()
  const shaftLength = length * 0.86
  const headLength = length * 0.14
  const headRadius = thick * 3.4
  const shaftPos = new THREE.Vector3()
    .copy(fromV)
    .add(dir.clone().normalize().multiplyScalar(shaftLength / 2))
  const headPos = new THREE.Vector3()
    .copy(fromV)
    .add(dir.clone().normalize().multiplyScalar(shaftLength + headLength / 2))
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
  return (
    <group>
      <mesh position={shaftPos.toArray()} quaternion={quat}>
        <cylinderGeometry args={[thick, thick, shaftLength, 12]} />
        <meshStandardMaterial color={colour} />
      </mesh>
      <mesh position={headPos.toArray()} quaternion={quat}>
        <coneGeometry args={[headRadius, headLength, 16]} />
        <meshStandardMaterial color={colour} />
      </mesh>
      <mesh position={fromV.toArray()}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
    </group>
  )
}

function ResidualSegment({
  from,
  to,
}: {
  from: [number, number, number]
  to: [number, number, number]
}) {
  // Dashed via a stack of small cylinders along the segment.
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = new THREE.Vector3().subVectors(b, a)
  const total = dir.length()
  const N = 8
  const dashLen = total / (N * 2 - 1)
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
  const dashes: ReactElement[] = []
  for (let i = 0; i < N; i++) {
    const tStart = (i * 2 * dashLen) / total
    const tMid = ((i * 2 + 0.5) * dashLen) / total
    void tStart
    const pos = new THREE.Vector3().copy(a).add(dir.clone().multiplyScalar(tMid))
    dashes.push(
      <mesh key={i} position={pos.toArray()} quaternion={quat}>
        <cylinderGeometry args={[0.012, 0.012, dashLen, 8]} />
        <meshStandardMaterial color="#C44536" transparent opacity={0.85} />
      </mesh>,
    )
  }
  return <group>{dashes}</group>
}

function RightAngleTick({ position }: { position: [number, number, number] }) {
  // A tiny square symbol at the foot of the perpendicular to remind the reader
  // that the residual is normal to the column space. Made of two small line
  // segments rather than a filled patch for visual lightness.
  const p = new THREE.Vector3(...position)
  const e = 0.16
  const a = new THREE.Vector3(p.x - e, p.y, p.z)
  const b = new THREE.Vector3(p.x - e, p.y + e, p.z)
  const c = new THREE.Vector3(p.x, p.y + e, p.z)
  return (
    <group>
      <Line a={a} b={b} colour="#6B6B6B" opacity={0.85} />
      <Line a={b} b={c} colour="#6B6B6B" opacity={0.85} />
    </group>
  )
}

function SlowOrbit() {
  // Same reduced-motion-aware orbit as NDLeapScene3D — OS pref + the app's
  // overflow-menu toggle both freeze the camera.
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
      const osPref = mql.matches
      const appPref =
        typeof document !== 'undefined' &&
        document.documentElement.dataset.reducedMotion === 'true'
      reducedMotionRef.current = osPref || appPref
    }
    compute()
    const onChange = () => compute()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  useFrame(({ camera, clock }: RootState) => {
    const appPref =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.reducedMotion === 'true'
    if (reducedMotionRef.current || appPref) {
      camera.position.set(4, 3, 5)
      camera.lookAt(1.0, 0.6, 0.2)
      return
    }
    const t = clock.getElapsedTime()
    const r = 5.6
    camera.position.x = Math.cos(t * 0.13) * r
    camera.position.z = Math.sin(t * 0.13) * r
    camera.position.y = 2.6 + Math.sin(t * 0.09) * 0.4
    camera.lookAt(1.0, 0.6, 0.2)
  })
  return null
}
