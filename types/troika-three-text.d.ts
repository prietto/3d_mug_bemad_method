declare module 'troika-three-text' {
  import { Object3D, Material } from 'three'

  export class Text extends Object3D {
    text: string
    font?: string
    fontSize: number
    color: string | number
    anchorX: string | number
    anchorY: string | number
    maxWidth?: number
    whiteSpace: string
    material?: Material
    sync(): void
    dispose(): void
  }
}
