export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const dictKey = process.env.MW_DICTIONARY_KEY;

  try {
    const response = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictKey}`);
    const data = await response.json();

    if (data && data[0] && typeof data[0] === 'object') {
      return Response.json({
        // Extracting base form (lemmatization)
        baseWord: data[0].hwi?.hw?.replace(/\*/g, "").toLowerCase() || word.toLowerCase(),
        definition: data[0].shortdef?.[0] || "Definition not found",
        pronunciation: data[0].hwi?.prs?.[0]?.mw || "N/A"
      });
    }
    return Response.json({ error: "Word not found" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: "API Error" }, { status: 500 });
  }
}
