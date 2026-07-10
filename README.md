# stijnvangorkum.nl

Portfolio-website van Stijn van Gorkum — regisseur & miniatuurbouwer.

Statische React-app (Create React App + Tailwind). **Geen backend**: alle
content staat in [`src/content.json`](src/content.json) en alle afbeeldingen
in [`public/images/`](public/images/).

## Content aanpassen

Alle teksten, projecten, afbeeldingen en video's staan in `src/content.json`.

- Elk project is een object in de lijst `elementen`.
- `positie` 1 t/m 5 = zwevend object op de homepage; `positie` 6 of hoger = archief.
- `afbeeldingen` is een lijst paden naar bestanden in `public/images/`.
- `videos` is een lijst `{ "url": "...", "title": "..." }` (YouTube-watch-URL's
  worden automatisch omgezet naar embeds).
- In tekstvelden werkt opmaak: `[b]vetgedrukt[b]` en `[Button:Tekst:https://link]`.

Nieuwe afbeelding? Zet het bestand in `public/images/` en verwijs ernaar als
`/images/bestandsnaam.png`.

## Bouwen en publiceren

```
npm install        # eenmalig / na wijzigingen in package.json
npm run build
```

Upload daarna de **inhoud** van de map `build/` naar de webhosting van
stijnvangorkum.nl (zoals altijd). Het bestand `.htaccess` zit in de build en
moet mee.

## Lokaal bekijken

```
npm start
```

Opent http://localhost:3000.

## Historie

Tot juli 2026 kwam de content uit Appwrite (gratis tier), maar dat project
moest wekelijks handmatig geheractiveerd worden. De content is toen
geëxporteerd en in de repo gebakken; de imgur/postimg-hotlinks zijn
vervangen door lokaal gehoste afbeeldingen. GitHub Pages wordt niet meer
gebruikt — de site draait op eigen hosting.
