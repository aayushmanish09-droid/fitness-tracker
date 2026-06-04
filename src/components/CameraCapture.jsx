import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, Check, AlertCircle, ImageIcon } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui.jsx'
import { squareCrop, readImageAsAvatar } from '../lib/image.js'

export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [shot, setShot] = useState(null) // captured data URL preview

  useEffect(() => {
    if (!open) return
    setError('')
    setReady(false)
    setShot(null)
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('no-camera')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
          setReady(true)
        }
      } catch (e) {
        setError(
          e.name === 'NotAllowedError'
            ? 'denied'
            : e.name === 'NotFoundError' || e.name === 'NotReadableError'
              ? 'no-camera'
              : 'generic',
        )
      }
    }
    start()
    return () => {
      cancelled = true
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  function capture() {
    if (!videoRef.current) return
    setShot(squareCrop(videoRef.current, 400, 0.85, true))
  }

  function confirm() {
    if (shot) {
      onCapture(shot)
      handleClose()
    }
  }

  function handleClose() {
    stopStream()
    onClose()
  }

  async function onFallbackFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await readImageAsAvatar(file)
      onCapture(url)
      handleClose()
    } catch (err) {
      setError('generic')
    }
  }

  const errorMessage = {
    denied: 'Camera permission was blocked. Allow camera access in your browser, or pick a photo from your library instead.',
    'no-camera': 'No camera was found on this device. Pick a photo from your library instead.',
    generic: 'Something went wrong with the camera. Try again or pick a photo from your library.',
  }[error]

  return (
    <Modal open={open} onClose={handleClose} title="Take a photo" maxWidth="max-w-md">
      <div className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pull/15 text-pull">
              <AlertCircle className="h-7 w-7" />
            </span>
            <p className="text-sm text-mist">{errorMessage}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-lime-300">
              <ImageIcon className="h-4 w-4" />
              Choose from library
              <input type="file" accept="image/*" className="hidden" onChange={onFallbackFile} />
            </label>
          </div>
        ) : (
          <>
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-ink-900">
              {shot ? (
                <img src={shot} alt="Captured preview" className="h-full w-full object-cover" />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // mirror like a selfie
                />
              )}
              {!ready && !shot && (
                <div className="absolute inset-0 grid place-items-center text-sm text-ash">
                  Starting camera…
                </div>
              )}
            </div>

            {shot ? (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShot(null)}>
                  <RefreshCw className="h-4 w-4" />
                  Retake
                </Button>
                <Button className="flex-1" onClick={confirm}>
                  <Check className="h-5 w-5" />
                  Use photo
                </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={capture} disabled={!ready}>
                <Camera className="h-5 w-5" />
                Capture
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
