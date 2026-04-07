## 🏡 RealAdvisor Technical Challenge — "Agent Marketing Hub"

### Phase 3: Code Review (~15 min, written)

Review this function and write your analysis in `CODE_REVIEW.md`:

```typescript
async function generateListingContent(property: Property, platform: string) {
  const prompt = `Write a ${platform} listing for: ${JSON.stringify(property)}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Called from the API route:
app.post('/generate', async (req, res) => {
  const { propertyId, platforms } = req.body;
  const property = await db.properties.findById(propertyId);
  
  const results = {};
  for (const platform of platforms) {
    results[platform] = await generateListingContent(property, platform);
  }
  
  res.json(results);
});
```

- Pas de vérification sur les données d'entrée. DTO IN
- Pas d'enum sur plateform. Possibilité de mettre ce qu'on veut.
- Pas de vérification le tyape de sortie. DTO OUT
- Pas de prompt systeme pour mettre du context au chat.
- Pas de vérification sur les données envoyées au chat. On envoie toutes les données de property
- Pas de try catch sur le call. Risque de plantage du serveur.
- Suivant le modele utilisé, la réponse peut être lente. On peut envisager de mettre en place un systeme de polling sur un status de generating assets ou du SSE.




