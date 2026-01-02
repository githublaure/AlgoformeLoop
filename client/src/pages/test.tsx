import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Test() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [renderMode, setRenderMode] = useState<'canvas' | 'video'>('canvas');

  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const baseUrl = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/`;
  const assets = {
    background: `${baseUrl}test/video1m44.mov`,
    avatar: `${baseUrl}pigeon_talking.mp4`,
    voice: `${baseUrl}test/fit-attention presentation.mp3`,
  };

  useEffect(() => {
    return () => {
      stopDemo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupCanvas = () => {
    const avatarVideo = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!avatarVideo || !canvas) return;

    if (avatarVideo.readyState >= 1 && avatarVideo.videoWidth && avatarVideo.videoHeight) {
      canvas.width = avatarVideo.videoWidth;
      canvas.height = avatarVideo.videoHeight;
      setRenderMode('canvas');
    } else {
      setTimeout(setupCanvas, 100);
    }
  };

  const processFrame = () => {
    const avatarVideo = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!avatarVideo || !canvas || avatarVideo.paused || avatarVideo.ended) return;

    if (!avatarVideo.videoWidth || !avatarVideo.videoHeight) {
      setRenderMode('video');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderMode('video');
      return;
    }

    ctx.drawImage(avatarVideo, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const shouldKeepPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      if (r > 25 || g > 25 || b > 25) return true;

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
            if (nr > 40 || ng > 40 || nb > 40) return true;
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

  const startDemo = async () => {
    const avatarVideo = avatarVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    const voice = voiceRef.current;

    if (!avatarVideo || !backgroundVideo || !voice) return;

    setupCanvas();

    try {
      await backgroundVideo.play();
    } catch (error) {
      console.error('Lecture vidéo de fond impossible', error);
    }

    try {
      await voice.play();
    } catch (error) {
      console.error('Lecture audio impossible', error);
    }

    avatarVideo.currentTime = 0;
    avatarVideo.muted = true;
    try {
      await avatarVideo.play();
      setIsPlaying(true);
      setRenderMode('canvas');
      processFrame();
    } catch (error) {
      console.error('Lecture avatar impossible', error);
      setRenderMode('video');
      setIsPlaying(true);
      processFrame();
    }
  };

  const stopDemo = () => {
    const avatarVideo = avatarVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    const voice = voiceRef.current;

    avatarVideo?.pause();
    backgroundVideo?.pause();
    if (voice) {
      voice.pause();
      voice.currentTime = 0;
    }

    if (avatarVideo) {
      avatarVideo.currentTime = 0;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-4 left-4 z-50 flex items-center space-x-3">
        <img src="/pigeongangsta.png" alt="PigeonSubcription" className="w-12 h-12 rounded-full border border-white/20" />
        <div>
          <p className="text-sm text-white/70">Démo temps réel</p>
          <p className="text-xl font-semibold">PigeonSubscription</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-50 flex space-x-2">
        <Button onClick={() => setLocation('/')} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
          <i className="fas fa-arrow-left mr-2"></i>Retour
        </Button>
        <Button onClick={startDemo} className="bg-green-500 hover:bg-green-600 text-white" disabled={isPlaying}>
          ▶️ Démarrer
        </Button>
        <Button onClick={stopDemo} variant="outline" className="border-white/30 text-white hover:bg-white/20">
          ⏹ Stop
        </Button>
      </div>

      <div className="w-full h-full absolute inset-0">
        <video
          ref={backgroundVideoRef}
          src={assets.background}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      </div>

      <div className="relative w-full h-full flex items-end justify-end p-6">
        <div className="relative w-72 h-72">
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${renderMode === 'canvas' ? 'block' : 'hidden'}`}
          />
          <video
            ref={avatarVideoRef}
            src={assets.avatar}
            className={`absolute inset-0 w-full h-full object-contain ${renderMode === 'video' ? 'block' : 'hidden'}`}
            loop
            playsInline
            muted
            onLoadedMetadata={setupCanvas}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-sm border border-white/20">
            Avatar animé (fond noir supprimé)
          </div>
        </div>
      </div>

      <audio ref={voiceRef} src={assets.voice} />
    </div>
  );
}
