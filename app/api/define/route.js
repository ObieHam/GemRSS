export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  
  // Vercel will inject this from your Environment Variables settings
  const dictKey = process.env.MW_DICTIONARY_KEY;

  if (!dictKey) {
    return Response.json({ error: "API Key is missing in Vercel settings" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictKey}`);
    const data = await response.json();

    // Check if the API returned a valid result
    if (data && data[0] && typeof data[0] === 'object') {
      return Response.json({
        // Extracting base form to prevent duplicates (e.g., "running" becomes "run")
        baseWord: data[0].hwi?.hw?.replace(/\*/g, "").toLowerCase() || word.toLowerCase(),
        definition: data[0].shortdef?.[0] || "Definition not found",
        pronunciation: data[0].hwi?.prs?.[0]?.mw || "N/A"
      });
    }
    
    // If word is not found, Merriam-Webster often returns an array of suggestions
    return Response.json({ error: "Word not found in dictionary" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: "Failed to connect to Merriam-Webster" }, { status: 500 });
  }
}
