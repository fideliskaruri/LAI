import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

/**
 * The actual three.js scene for the nD leap (states nd-2 and nd-3).
 * Lazy-loaded so the r3f + three.js bundle doesn't ship to the hub or to
 * other Vectors acts.
 */

interface Props {
  fadeAxes: boolean
  showNumbers: boolean
  numbers: string[]
}

export default function NDLeapScene3D({ fadeAxes, showNumbers, numbers }: Props) {
  return (
    <div className="w-full grid grid-cols-[2fr_1fr] gap-4 items-stretch">
      <div className="aspect-[5/4] w-full">
        <Canvas
          camera={{ position: [4, 3, 5], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.7} />
          <Axes opacity={fadeAxes ? 0.18 : 0.7} />
          <Arrow from={[0, 0, 0]} to={[2.2, 1.4, 1.6]} />
          <SlowOrbit />
        </Canvas>
      </div>
      <div
        className={`flex flex-col items-center justify-center transition-opacity duration-500 ${
          showNumbers ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showNumbers}
      >
        <div className="border border-graph-fade rounded-sm py-4 px-4 w-full max-w-[140px]">
          {numbers.slice(0, 5).map((n, i) => (
            <div key={i} className="font-mono text-[14px] text-ink text-center my-1">
              {n}
            </div>
          ))}
          <div className="font-mono text-[14px] text-dim text-center">⋮</div>
        </div>
      </div>
    </div>
  )
}

function Axes({ opacity }: { opacity: number }) {
  // Three orthogonal lines, each unit-length
  const mat = new THREE.LineBasicMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity,
  })
  const make = (a: THREE.Vector3, b: THREE.Vector3) => {
    const geom = new THREE.BufferGeometry().setFromPoints([a, b])
    return new THREE.Line(geom, mat)
  }
  return (
    <group>
      <primitive object={make(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(3, 0, 0))} />
      <primitive object={make(new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 3, 0))} />
      <primitive object={make(new THREE.Vector3(0, 0, -3), new THREE.Vector3(0, 0, 3))} />
    </group>
  )
}

function Arrow({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const fromV = new THREE.Vector3(...from)
  const toV = new THREE.Vector3(...to)
  const dir = new THREE.Vector3().subVectors(toV, fromV)
  const length = dir.length()
  const mid = new THREE.Vector3().addVectors(fromV, toV).multiplyScalar(0.5)
  const shaftLength = length * 0.85
  const headLength = length * 0.15
  const headRadius = 0.07

  // The shaft is a thin cylinder from `from` toward `to`, length = shaftLength
  // Cone (arrowhead) sits at the tip
  const shaftPos = new THREE.Vector3().copy(fromV).add(dir.clone().normalize().multiplyScalar(shaftLength / 2))
  const headPos = new THREE.Vector3().copy(fromV).add(dir.clone().normalize().multiplyScalar(shaftLength + headLength / 2))

  // Orient along the direction (default cylinder is along Y)
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())

  return (
    <group>
      <mesh position={shaftPos.toArray()} quaternion={quat}>
        <cylinderGeometry args={[0.02, 0.02, shaftLength, 12]} />
        <meshStandardMaterial color="#C44536" />
      </mesh>
      <mesh position={headPos.toArray()} quaternion={quat}>
        <coneGeometry args={[headRadius, headLength, 16]} />
        <meshStandardMaterial color="#C44536" />
      </mesh>
      {/* Origin dot */}
      <mesh position={fromV.toArray()}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      {/* Suppress unused-var lints by referencing mid */}
      <group position={mid.toArray()} visible={false} />
    </group>
  )
}

function SlowOrbit() {
  // Slow CCW rotation about the Y axis for a subtle parallax feel.
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    const r = 6
    camera.position.x = Math.cos(t * 0.15) * r
    camera.position.z = Math.sin(t * 0.15) * r
    camera.position.y = 3
    camera.lookAt(0, 0, 0)
  })
  return null
}
