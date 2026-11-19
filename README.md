# Planchettes

Des modèles de planchettes en bois à construire pas à pas, comme une notice de briques : une vue 3D qu'on fait tourner, un plan vu de dessus et de face, et le nombre de planchettes pour chaque étape. Tous les modèles tiennent avec 200 planchettes.

## Lancer

```bash
npm install
npm run dev     # le site
npm test        # les tests, dont la vérification de stabilité
npm run build   # le site statique dans dist/
```

## Ajouter un modèle

1. Créer `src/models/<id>.ts` qui exporte un `Model` : une liste d'étapes, chaque étape une liste de planchettes dans l'ordre de pose.
2. Placer les planchettes avec `at(orientation, x, y, z)` (coin minimal, une unité = l'épaisseur d'une planchette, une planchette fait 1 × 3 × 15).
3. L'ajouter à `src/models/index.ts`.
4. `npm test` : le modèle doit tenir sous 200 planchettes, avoir 3 à 8 planchettes par étape, et tenir debout après chaque planchette posée, même posée avec un millimètre d'écart.

Le test de stabilité est une simulation : on construit chaque modèle en vrai avant de le considérer comme fini.

## Licence

MIT
