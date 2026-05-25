/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOSE_IMAGE_URL?: string
  readonly VITE_HONK_SOUND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
