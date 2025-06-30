export async function generateVoiceReminder(text: string): Promise<string> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error("ElevenLabs API key not found in environment variables");
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey
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
