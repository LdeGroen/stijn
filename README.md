# stijnvangorkum.nl

Portfolio-website van Stijn van Gorkum — regisseur & miniatuurbouwer.

Statische React-app (Create React App + Tailwind). **Geen backend**: alle
content staat in [`src/content.json`](src/content.json) en alle afbeeldingen
in [`public/images/`](public/images/).

## Content aanpassen (voor Stijn: het dashboard)

Ga naar **https://www.stijnvangorkum.nl/beheer/** en log in met een
GitHub-token. Daar kun je projecten toevoegen, teksten aanpassen en
afbeeldingen uploaden. Na "Opslaan" bouwt GitHub Actions de site en staat de
wijziging binnen een paar minuten live — er hoeft niets handmatig geüpload
te worden.

## Content aanpassen (handmatig)

Alle teksten, projecten, afbeeldingen en video's staan in `src/content.json`.

- Elk project is een object in de lijst `elementen`.
- `positie` 1 t/m 5 = zwevend object op de homepage; `positie` 6 of hoger = archief.
- `afbeeldingen` is een lijst paden naar bestanden in `public/images/`.
- `videos` is een lijst `{ "url": "...", "title": "..." }` (YouTube-watch-URL's
  worden automatisch omgezet naar embeds).
- In tekstvelden werkt opmaak: `[b]vetgedrukt[b]` en `[Button:Tekst:https://link]`.

Nieuwe afbeelding? Zet het bestand in `public/images/` en verwijs ernaar als
`/images/bestandsnaam.png`.

## Publiceren

Publiceren gaat automatisch: elke push naar `main` (ook commits vanuit het
beheerdashboard) triggert [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
die de site bouwt en via SFTP naar `/www` op de TransIP-hosting zet.

Daarvoor moeten deze GitHub-secrets bestaan (repo → Settings → Secrets and
variables → Actions):

| Secret | Waarde |
|---|---|
| `SFTP_HOST` | SFTP-hostnaam uit het TransIP-controlepaneel |
| `SFTP_USER` | SFTP-gebruikersnaam |
| `SFTP_PASS` | SFTP-wachtwoord |
| `SFTP_PORT` | (optioneel) poort, standaard 22 |

Handmatig bouwen kan nog steeds:

```
npm install        # eenmalig / na wijzigingen in package.json
npm run build
```

Upload dan de **inhoud** van `build/` (inclusief `.htaccess`) naar `/www`.

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
