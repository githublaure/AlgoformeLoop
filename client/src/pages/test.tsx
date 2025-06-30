import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Test() {
  const [, setLocation] = useLocation();
  const [isTalking, setIsTalking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Démarrer automatiquement la vidéo au chargement de la page
  useEffect(() => {
    // Vérifier que les fichiers sont accessibles
    const checkFiles = async () => {
      try {
        const videoResponse = await fetch('/test/video1m44.mov');
        const audioResponse = await fetch('/test/fit-attention presentation.mp3');
        
        console.log("Vérification fichiers:", {
          video: videoResponse.ok ? "OK" : "Manquant",
          audio: audioResponse.ok ? "OK" : "Manquant"
        });
      } catch (error) {
        console.log("Erreur vérification fichiers:", error);
      }
    };

    checkFiles();

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

    console.log("Configuration vidéo:", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      src: video.src
    });

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

      if (r > 25 || g > 25 || b > 25) {
        return true;
      }

      const checkRadius = 2;
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

            if (nr > 40 || ng > 40 || nb > 40) {
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

        if (r < 15 && g < 15 && b < 15 && !shouldKeepPixel(x, y)) {
          data[i + 3] = 0;
        } else if (r < 25 && g < 25 && b < 25) {
          data[i + 3] = Math.max(data[i + 3], 200);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startVideo = () => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video && !isTalking) {
      // Activer le son de la vidéo
      video.muted = false;
      video.volume = 0.8;
      video.currentTime = 0;

      // Essayer de lire la vidéo avec son
      video.play().then(() => {
        setIsTalking(true);
        processFrame();
        console.log("Vidéo lancée avec succès");
      }).catch(error => {
        console.log("Erreur de lecture vidéo:", error);
        // Fallback: essayer avec l'audio séparé
        if (audio) {
          video.muted = true;
          audio.volume = 0.8;
          audio.currentTime = 0;
          
          Promise.all([
            video.play(),
            audio.play()
          ]).then(() => {
            setIsTalking(true);
            processFrame();
            console.log("Fallback audio lancé");
          }).catch(err => {
            console.log("Erreur fallback:", err);
            // Dernière tentative: vidéo muette seulement
            video.play().then(() => {
              setIsTalking(true);
              processFrame();
            });
          });
        }
      });
    }
  };

  const stopVideo = () => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
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
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{ 
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
            }}
          />
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

      {/* Vidéo avec audio intégré */}
      <video
        ref={videoRef}
        className="hidden"
        onEnded={handleVideoEnd}
        onLoadedData={setupVideoProcessing}
        preload="metadata"
        playsInline
        controls={false}
      >
        <source src="/test/video1m44.mov" type="video/quicktime" />
        <source src="/test/video1m44.mov" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Audio de backup si besoin */}
      <audio ref={audioRef} preload="metadata" onEnded={handleVideoEnd} style={{ display: 'none' }}>
        <source src="/test/fit-attention presentation.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}