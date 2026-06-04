import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const here = dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    // point Tailwind at this project's config explicitly (cwd-independent)
    tailwindcss: { config: resolve(here, 'tailwind.config.js') },
    autoprefixer: {},
  },
}
