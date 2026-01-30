const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

const VOICE_IDS: Record<string, string> = {
  "pierre-pigeon": process.env.ELEVENLABS_VOICE_PIERRE_PIGEON || process.env.ELEVENLABS_VOICE_PIERRE || DEFAULT_VOICE_ID,
  "marie-colombe": process.env.ELEVENLABS_VOICE_MARIE_COLOMBE || process.env.ELEVENLABS_VOICE_MARIE || DEFAULT_VOICE_ID,
};

const resolveVoiceId = (voiceName?: string) => {
  if (!voiceName) return DEFAULT_VOICE_ID;
  const key = voiceName.trim().toLowerCase();
  return VOICE_IDS[key] || DEFAULT_VOICE_ID;
};

export async function generateVoiceReminder(text: string, apiKey?: string, voiceName?: string): Promise<string> {
  const resolvedApiKey = apiKey || process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("ElevenLabs API key not found in environment variables");
  }

  try {
    const voiceId = resolveVoiceId(voiceName);
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": resolvedApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // In a real implementation, you would save the audio file and return the URL
    // For now, we'll return a placeholder URL
    const audioBuffer = await response.arrayBuffer();
    
    // In production, save to cloud storage and return the URL
    // For demo purposes, return a data URL or placeholder
    return `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
    
  } catch (error) {
    console.error("Error generating voice reminder:", error);
    throw new Error("Failed to generate voice reminder");
  }
}
