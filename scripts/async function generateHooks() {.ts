async function generateHooks() {
  const videoResponse = await fetch(clip.url);
  if (!videoResponse.ok || !videoResponse.body) {
    throw new Error(`Failed to access URL. HTTP status: ${videoResponse.status}`);
  }

  const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
  const arrayBuffer = await videoResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tempFilePath = path.join(path.join(__dirname,"temp"), `video_${Date.now()}.mp4`);
  await fsPromises.writeFile(tempFilePath, buffer);
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const onScreenTextResult = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: hookPrompt },
          {
            fileData: {
              fileUri: uploadResult.uri,
              mimeType: uploadResult.mimeType || mimeType,
            },
          },
        ],
      },
    ],
  });
}
