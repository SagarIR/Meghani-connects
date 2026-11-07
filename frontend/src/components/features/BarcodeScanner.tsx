'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, FlashlightOff, Scan, RefreshCw, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  // Start camera
  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        await videoRef.current.play()
        setIsScanning(true)
        startScanLoop()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Barcode detection using BarcodeDetector API (if available)
  const startScanLoop = () => {
    if (!('BarcodeDetector' in window)) {
      // Fallback for browsers without BarcodeDetector
      setError('Barcode detection not supported in this browser. Please enter code manually.')
      return
    }

    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
    })

    const detectBarcode = async () => {
      if (!videoRef.current || !isScanning) return

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current)
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue
          if (code && code !== lastScanned) {
            setLastScanned(code)
            onScan(code)
            // Visual feedback
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')
              if (ctx) {
                ctx.strokeStyle = '#22c55e'
                ctx.lineWidth = 4
                const { boundingBox } = barcodes[0]
                ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
              }
            }
            // Brief pause before continuing
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } catch (err) {
        // Ignore detection errors, continue scanning
      }

      animationRef.current = requestAnimationFrame(detectBarcode)
    }

    detectBarcode()
  }

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
    }
  }

  // Cleanup on unmount or close
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Scan className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Barcode Scanner</h2>
                <p className="text-sm text-gray-500">Scan product barcode</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Camera View */}
          <div className="relative aspect-video bg-gray-900">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-white font-medium mb-2">{error}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={startCamera}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                
                {/* Scan overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner markers */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* Status indicator */}
                {isScanning && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-white text-sm">Scanning...</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Last scanned */}
            {lastScanned && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 right-4"
              >
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  <span className="font-mono">{lastScanned}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="p-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Or enter barcode manually:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter barcode number..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
              <Button 
                type="submit" 
                variant="primary"
                disabled={!manualCode.trim()}
              >
                Add
              </Button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
