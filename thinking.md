## 🏡 RealAdvisor Technical Challenge — "Agent Marketing Hub"

### Phase 1

1. **Who is the user?**
L'utilisateur utilise l'outil principalement sur téléphone sur des actions rapide (nouveau contrat potentiel, rendez-vous), entre plusieurs RDV client, visite avec les futurs acquéreurs. Ponctuellement dans la journée quand il n'a pas de rendez-vous il utilise l'outil de manière plus pro actif dont le CRM.
La plus grande frustration est de devoir répliquer la communication au travers de multiple canaux. Le côté répétitif mais essentiel de dire la même chose mais dans une forme différente afin de s'adapter au public porpre de chaque canaux.
L'agent n'a pas forcélement le temps de le faire sur tous les canaux et perds potentiellement une partie de potentiel client.
2. **What makes a great property description?**
Ce qui va varier ce sont principalement : le vocabulaire utilisé, le format (court, long).
Sur un portail immobilier on va énumérer chaque détail de la propriété et en utilisant des termes conventionels.
Sur Insta on va plûtot mettre en avant certains aspect de la maison sans tout énumérer. On ne va plus utiliser de termes conventionels mais plutôt du vocabulaire ciblé pour un public de 20-35 ans avec, une phrase percutante pour la photo ou video, un call to action qui donne envie d'en savoir plus rapidement, des emojis, des hashtags, raconte le life style du quartier.
Sur Whatsapp sera plus direct, proposition à un public restreint. Pas besoin de beaucoup d'informations, on cherche l'appel rapidement. 
3. **Architecture sketch.**
┌─────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                 │
│                                                                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐    │
│  │  Property Form  │   │ Listing Review  │   │  Asset Preview  │    │
│  │                 │   │ [Enhance w/ AI] │   │  [Regenerate ]  │    │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘    │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            │ property +          │ listing_id          │ listing_id
            │ listing data        │                     │ + platform + tone
            │                     │                     │  + language
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                             BACKEND                                 │
│                                                                     │
│  ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────┐ │
│  │POST /listing     │  │POST /listings/:id │  │POST /listings/:id │ │
│  │GET /listings     │  │/enhance           │  │/generate          │ │
│  └────────┬─────────┘  └────────┬──────────┘  └────────┬──────────┘ │
│           │                     │                      │            │
│           │              ┌──────┴──────────────────────┘            │
│           │              │      AI PIPELINE                         │
│           │              │                                          │
│           │              │  ┌──────────────────────────────────┐    │
│           │              │  │          Prompt Builder          │    │
│           │              ├─▶│  prompt_template + language      │    │
│           │      |–––––▶ │  │  + property data + listing data  │    │
│           │      |       │  └─────────────────┬────────────────┘    │
│           │      |       │                    ▼                     │
│           │      |       │  ┌──────────────────────────────────┐    │
│           |      |       │  │           LLM API                │    │
│           │      |       │  │       structured output          │    │
│           │      |       │  └─────────────────┬────────────────┘    │
│           │      |       └──────────┬─────────┘                     │
└───────────┼──────|──────────────────┼───────────────────────────────┘
            │    EVENT                │
            ▼      △                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            DATABASE                                 │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────────────────┐ │
│  │      listing         │      │       listing-photo              │ │
│  │                      │      │                                  │ │
│  │ - uuid               │ 1──N │ - uuid                           │ │
│  │ - address            │      │ - url                            │ │
│  │ - neighborhood       │      │ - caption                        │ │
│  │ - surface            │      │                                  │ │
│  │ - rooms              │      │                                  │ │
│  │ - photos             │      │                                  │ │
│  │ - notes              │      │                                  │ │
│  │ - ...                │      │                                  │ │
│  └──────────────────────┘      └──────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────────────────┐ │
│  │   prompt_templates   │      │        generated_assets          │ │
│  │                      │      │                                  │ │
│  │ - id                 │      │ - id                             │ │
│  │ - type               │      │ - listing_id (FK)                │ │
│  │   (enhance /         │      │ - platform                       │ │
│  │    instagram / ...)  │      │ - content                        │ │
│  │ - template           │      │ - version                        │ │
│  │ - locale             │      │ - created_at                     │ │
│  └──────────────────────┘      │                                  │ │
│                                └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
4. **What would you ship first if you only had 2 hours?**
Je ne ferai pas de versioning. Je ne ferai pas d'enregistrement des assets en base de donnée. Je ferai que deux pages côté front.
On crée une annonce => on améliore l'annonce en écrasant l'actuelle
On génère des assets => on reçois le texte, si on rafraichie la page on refait le call.
5. **What are the failure modes?**
L'IA peut inventer ou halluciner sur les détails de la propriété. Il faut donc, dans le prompt, bien insister sur le fait de ne repartir que sur les datas de l'annonce fournis. Idem, pour les prix. Invertir côté front : l'utilisateur qui doit vérifier l'annonce générée par l'IA.