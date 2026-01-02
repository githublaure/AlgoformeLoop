import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Test() {
  const [, setLocation] = useLocation();
  const [isTalking, setIsTalking] = useState(false);
  const [renderMode, setRenderMode] = useState<'canvas' | 'video'>('canvas');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const baseUrl = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/`;
  const videoSrc = `${baseUrl}test/Introduction-To-Cybersecurity.mp4`;

  // Démarrer automatiquement la vidéo au chargement de la page
  useEffect(() => {
    // Petit délai pour s'assurer que les refs sont prêtes
    const timer = setTimeout(() => {
      startVideo();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const setupVideoProcessing = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      console.log("Video ou canvas manquant");
      return;
    }

    // Attendre que les métadonnées soient chargées pour .mov
    if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setRenderMode('canvas');
      console.log("Configuration vidéo:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        src: video.src
      });
    } else {
      // Retry après un court délai
      setTimeout(setupVideoProcessing, 100);
    }
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    if (!video.videoWidth || !video.videoHeight) {
      setRenderMode('video');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderMode('video');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const shouldKeepPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Seuil plus élevé pour garder plus de détails du pigeon
      if (r > 30 || g > 30 || b > 30) {
        return true;
      }

      // Vérifier les contours avec un rayon plus large pour .mov
      const checkRadius = 3;
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            const nr = data[nIndex];
            const ng = data[nIndex + 1];
            const nb = data[nIndex + 2];

            // Seuil plus sensible pour détecter les contours
            if (nr > 35 || ng > 35 || nb > 35) {
              return true;
            }
          }
        }
      }
      return false;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Traitement adapté pour le fichier .mov
        if (r < 20 && g < 20 && b < 20 && !shouldKeepPixel(x, y)) {
          // Rendre complètement transparent le fond noir
          data[i + 3] = 0;
        } else if (r < 35 && g < 35 && b < 35) {
          // Ajuster l'opacité des zones sombres mais pas noires
          const intensity = Math.max(r, g, b);
          data[i + 3] = Math.min(255, intensity * 8);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startVideo = () => {
    const video = videoRef.current;

    if (video && !isTalking) {
      // S'assurer que les métadonnées sont chargées
      if (video.readyState < 1) {
        console.log("En attente du chargement des métadonnées...");
        video.addEventListener('loadedmetadata', startVideo, { once: true });
        return;
      }

      // Configurer le canvas avec les bonnes dimensions
      setupVideoProcessing();

      // Activer le son de la vidéo (.mov peut avoir de l'audio intégré)
      video.muted = false;
      video.volume = 0.8;
      video.currentTime = 0;

      // Essayer de lire la vidéo avec son
      video.play().then(() => {
        setIsTalking(true);
        setRenderMode('canvas');
        processFrame();
        console.log("Vidéo .mov lancée avec succès");
      }).catch(error => {
        console.log("Erreur de lecture vidéo .mov:", error);
        setRenderMode('video');
        // Dernière tentative: vidéo muette seulement
        video.play().then(() => {
          setIsTalking(true);
          setRenderMode('video');
          processFrame();
          console.log("Vidéo .mov muette lancée");
        });
      });
    }
  };

  const stopVideo = () => {
    const video = videoRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsTalking(false);
    }
  };

  const handleVideoEnd = () => {
    setIsTalking(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Bouton retour en haut à gauche */}
      <div className="absolute top-4 left-4 z-50">
        <Button 
          onClick={() => setLocation('/')}
          variant="outline"
          className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Retour
        </Button>
      </div>

      {/* Titre en haut au centre */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Démo IA PigeonSub
          </h1>
          <p className="text-white/80 text-sm">
            Présentation interactive (1m44s)
          </p>
        </div>
      </div>

      {/* Vidéo en plein écran */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isTalking ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              className={`max-w-full max-h-full object-contain ${renderMode === 'canvas' ? 'opacity-0 pointer-events-none absolute' : ''}`}
              onEnded={handleVideoEnd}
              onLoadedMetadata={setupVideoProcessing}
              onError={() => setRenderMode('video')}
              preload="metadata"
              playsInline
              controls={false}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {renderMode === 'canvas' && (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-64 h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm mb-8">
              <i className="fas fa-robot text-8xl text-white/80"></i>
            </div>
            <Button 
              onClick={startVideo}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl"
            >
              <i className="fas fa-play mr-3"></i>
              Lancer la démo IA
            </Button>
          </div>
        )}
      </div>

      {/* Contrôles vidéo */}
      {isTalking && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
            <Button 
              onClick={stopVideo}
              variant="outline"
              size="sm"
              className="bg-red-500/80 border-red-400 text-white hover:bg-red-600/80 rounded-full"
            >
              <i className="fas fa-stop mr-2"></i>
              Arrêter
            </Button>
            <Button 
              onClick={startVideo}
              variant="outline"
              size="sm"
              className="bg-green-500/80 border-green-400 text-white hover:bg-green-600/80 rounded-full"
            >
              <i className="fas fa-redo mr-2"></i>
              Relancer
            </Button>
          </div>
        </div>
      )}

      {/* Indicateur de durée */}
      <div className="absolute bottom-4 right-4 z-50">
        <div className="bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
          <i className="fas fa-clock mr-2"></i>
          1:44
        </div>
      </div>

    </div>
  );
}