import { esc } from '../lib/esc.js';

const T       = k  => window.T?.(k) ?? k;
const getLang = () => window.getLang?.() ?? 'fr';

const HELP_CONTENT={
  arrosage:{
    fr:{title:'💧 Jauges d\'arrosage',anchor:'arrosage',body:`
<p>Chaque barre indique le besoin en eau du sujet en temps réel. Les seuils s'adaptent automatiquement selon <strong>5 facteurs</strong>.</p>
<h3>Seuils de base (jours sans arrosage)</h3>
<table><tr><th>Situation</th><th>🟢 OK</th><th>🟠 Bientôt</th><th>🔴 Urgent</th></tr>
<tr><td>🪴 Pot intérieur</td><td>&lt;7j</td><td>7–14j</td><td>&gt;21j</td></tr>
<tr><td>🪴 Pot extérieur</td><td>&lt;5j</td><td>5–10j</td><td>&gt;18j</td></tr>
<tr><td>🌳 Pleine terre</td><td>&lt;14j</td><td>14–21j</td><td>&gt;35j</td></tr></table>
<h3>Multiplicateurs</h3>
<table><tr><th>Facteur</th><th>Mult.</th></tr>
<tr><td>Pot &lt;18 cm</td><td>×0,50</td></tr><tr><td>Pot 35–47 cm (réf.)</td><td>×1,00</td></tr><tr><td>Pot ≥62 cm</td><td>×1,50</td></tr>
<tr><td>Plein soleil</td><td>×0,72</td></tr><tr><td>Ombre</td><td>×1,35</td></tr>
<tr><td>Gel (&lt;5°C)</td><td>×3,0</td></tr><tr><td>Canicule (≥28°C)</td><td>×0,55</td></tr></table>
<h3>Déduction pluie</h3>
<p>Probabilité ≥70% → −3j · 40–69% → −1,5j · 15–39% → −0,5j</p>
<div class="info-box">Les plantes en intérieur/orangerie n'ont pas de correction météo.</div>`},
    en:{title:'💧 Watering Gauges',anchor:'arrosage',body:`<p>Each bar shows real-time water need. Thresholds adapt to 5 factors: pot size, sun exposure, temperature, rain probability and season.</p>`}
  },
  fertilisation:{
    fr:{title:'🌱 Jauges de fertilisation NPK',anchor:'fertilisation',body:`
<p>Les barres comparent vos apports réels des <strong>12 derniers mois</strong> aux cibles annuelles théoriques.</p>
<div class="warn-box">Les jauges n'apparaissent que si vous renseignez le <strong>poids en grammes</strong> ET un <strong>profil NPK</strong> sur chaque événement fertilisation.</div>
<h3>Cibles annuelles (source INRAE)</h3>
<table><tr><th>Mode / Ø pot</th><th>N</th><th>P</th><th>K</th><th>Ca</th><th>Mg</th></tr>
<tr><td>Pot &lt;25 cm</td><td>10g</td><td>3g</td><td>10g</td><td>4g</td><td>1,5g</td></tr>
<tr><td>Pot 25–39 cm</td><td>18g</td><td>6g</td><td>18g</td><td>8g</td><td>3g</td></tr>
<tr><td>Pot 40–54 cm</td><td>28g</td><td>9g</td><td>28g</td><td>12g</td><td>4g</td></tr>
<tr><td>Pot ≥55 cm</td><td>40g</td><td>13g</td><td>40g</td><td>18g</td><td>6g</td></tr>
<tr><td>Pleine terre</td><td>80g</td><td>25g</td><td>80g</td><td>30g</td><td>10g</td></tr></table>
<h3>Calcul des grammes</h3>
<div class="formula">g_élément = poids_apporté × composition% / 100</div>
<p>Exemple : 20g d'engrais 7-3-7 = 1,4g N + 0,6g P + 1,4g K</p>
<h3>Corrections météo</h3>
<p>T°&gt;25°C → cible N ×1,15 · Pluie &gt;10mm → cible K ×1,10 (lessivage)</p>`},
    en:{title:'🌱 NPK Fertilisation Gauges',anchor:'fertilisation',body:`<p>Bars compare actual inputs (last 12 months) against annual INRAE targets. Both weight in grams AND an NPK profile must be recorded on each fertilisation event.</p>`}
  },
  meteo:{
    fr:{title:'🌤 Module météo',anchor:'meteo',body:`
<p>Les données viennent d'<strong>Open-Meteo</strong> (gratuit, sans clé). Elles sont interpolées à vos coordonnées GPS exactes.</p>
<h3>Vent — données précises</h3>
<p>Vitesse et direction lues dans les tableaux <strong>horaires</strong> (<code>hourly.windspeed_10m</code>), plus précis que <code>current_weather</code> (grille synoptique grossière). La vitesse est la moyenne heure courante + 2h suivantes.</p>
<h3>Lever / coucher du soleil</h3>
<p>Source : <code>daily.sunrise</code> / <code>daily.sunset</code>. Durée du jour = coucher − lever.</p>
<h3>Alerte gel</h3>
<p>Seuil configurable de −5°C à +5°C. Bandeau bleu = risque demain. Bandeau rouge = risque aujourd'hui.</p>`},
    en:{title:'🌤 Weather Module',anchor:'meteo',body:`<p>Data from Open-Meteo (free, no key). Interpolated to your exact GPS coordinates. Wind uses hourly data for precision.</p>`}
  },
  humidite:{
    fr:{title:'💧 Hygrométrie',anchor:'humidite',body:`
<p>Taux d'humidité relative mesuré à l'heure courante à votre localisation exacte (<code>hourly.relative_humidity_2m</code>).</p>
<table><tr><th>Taux RH</th><th>Niveau</th><th>Impact agrumes</th></tr>
<tr><td>&lt;30%</td><td style="color:#e65100">Très sec</td><td>Risque acariens</td></tr>
<tr><td>40–60%</td><td style="color:#2e7d32">Idéal</td><td>Conditions optimales</td></tr>
<tr><td>61–75%</td><td style="color:#1565c0">Humide</td><td>Risque fongique</td></tr>
<tr><td>&gt;85%</td><td style="color:#880e4f">Saturé</td><td>Maladies fongiques</td></tr></table>
<div class="info-box">Au-dessus de 75% d'humidité, les fongicides de contact sont moins efficaces. Utilisez le mini-histogramme 6h pour choisir votre fenêtre de traitement.</div>`},
    en:{title:'💧 Humidity',anchor:'humidite',body:`<p>Relative humidity from <code>hourly.relative_humidity_2m</code> at your exact GPS location. 40–60% is ideal for citrus. Above 75%, fungal diseases and phyto treatments are less effective.</p>`}
  },
  lune:{
    fr:{title:'🌕 Phase lunaire',anchor:'lune',body:`
<p>Calculée par algorithme astronomique local — période synodique 29,530 59 jours, référence lune nouvelle du 6 janvier 2000 18h14 UTC.</p>
<h3>Conseils par phase</h3>
<table><tr><th>Phase</th><th>Conseil cultural</th></tr>
<tr><td>🌑 Nouvelle lune</td><td>Semis, repiquage, plantation</td></tr>
<tr><td>🌒 Croissant naissant</td><td>Greffage, bouturage</td></tr>
<tr><td>🌓 Premier quartier</td><td>Taille légère acceptable</td></tr>
<tr><td>🌔 Gibbeuse croissante</td><td>Fertilisation NPK optimale</td></tr>
<tr><td>🌕 Pleine lune</td><td>Fertilisation P & K · Ne pas tailler</td></tr>
<tr><td>🌗 Dernier quartier</td><td>Taille recommandée · Traitements phyto</td></tr>
<tr><td>🌘 Dernier croissant</td><td>Amendements de fond</td></tr></table>
<p>La barre de 29 cases montre la position dans le cycle. La case en ambre = aujourd'hui.</p>`},
    en:{title:'🌕 Lunar Phase',anchor:'lune',body:`<p>Calculated locally using the synodic period (29.530 59 days). The 29-box bar shows the cycle position — amber box = today. Each phase displays a specific cultural advice for citrus care.</p>`}
  },
  temperatures:{
    fr:{title:'🌡 Températures vécues',anchor:'temperatures',body:`
<p>Enregistrées automatiquement à chaque chargement météo pour les sujets <strong>en extérieur ou pleine terre</strong>.</p>
<h3>Éligibilité</h3>
<p>Emplacements enregistrés : extérieur, jardin, terrasse, pied de mur exposé, plein champ. Les plantes en intérieur/orangerie ne sont pas enregistrées mais l'historique existant est conservé.</p>
<h3>Contenu</h3>
<p>Record froid/chaud absolu · Graphique 30 jours · Liste complète (365 entrées max) · Badge ❄ si T°min ≤ 2°C</p>
<div class="info-box">Connaître la T° minimale réellement vécue permet de valider la rusticité et de calibrer les seuils d'hivernage pour les saisons suivantes.</div>`},
    en:{title:'🌡 Temperature Records',anchor:'temperatures',body:`<p>Auto-recorded at each weather load for outdoor and in-ground plants. Records absolute cold/warm, 30-day chart, frost warnings (≤2°C). Up to 365 entries per plant.</p>`}
  },
  verger:{
    fr:{title:'🌳 Vergers',anchor:'verger',body:`
<p>Vue en deux parties : carte IGN compacte (360 px) pour délimiter vos parcelles, et plan 2D SVG interactif pour positionner vos arbres. Deux modes : <strong>Vue</strong> (lecture seule) et <strong>Édition</strong> (modification).</p>
<h3>Sélection d'une parcelle cadastrale</h3>
<ol style="padding-left:18px;font-size:.9rem;line-height:1.8">
<li>Appuyez sur <strong>🏚 Cadastre</strong> — un réticule ⊕ apparaît au centre de la carte.</li>
<li>Déplacez la carte (panoramique) pour centrer votre parcelle sous le réticule ⊕.</li>
<li>Appuyez à nouveau sur <strong>🏚 Cadastre</strong> — identification via geo.api.gouv.fr + Nominatim, puis recherche IGN.</li>
<li>Si plusieurs résultats : naviguez avec ‹ › ou tapez le numéro visible sur la carte dans le champ de recherche.</li>
<li>Choisissez <strong>🌳 Créer un nouveau verger</strong> ou <strong>✓ Appliquer à l'onglet actif</strong>.</li>
</ol>
<div class="info-box">La carte démarre toujours depuis votre position GPS — jamais depuis les données stockées, ce qui garantit des coordonnées fiables.</div>
<h3>Tracer son plan manuellement</h3>
<p>Si vous n'avez pas de parcelle cadastrale, tracez votre propre périmètre directement sur le plan SVG :</p>
<ol style="padding-left:18px;font-size:.9rem;line-height:1.8">
<li>Passez en mode Édition (bouton <strong>✏ Modifier</strong>).</li>
<li>Appuyez sur <strong>✏ Tracer</strong> dans la barre d'outils — le bouton devient rouge.</li>
<li>Touchez le plan pour ajouter des points. Tapez un point existant pour le supprimer.</li>
<li>Fermez en touchant le premier point ⊕, en double-tapant, ou en appuyant à nouveau sur <strong>✏ Valider</strong>.</li>
</ol>
<p>Pour modifier un tracé existant : appuyer sur <strong>✏ Tracer</strong> recharge les points existants pour modification. Pour repartir de zéro : bouton <strong>⬜ Effacer</strong>.</p>
<h3>Barre d'outils carte</h3>
<table><tr><th>Bouton</th><th>Action</th></tr>
<tr><td>📍 GPS</td><td>Recentrer sur votre position GPS</td></tr>
<tr><td>🏚 Cadastre</td><td>1er appui : réticule · 2e appui : recherche parcelle</td></tr>
<tr><td>⊕ Parcelle</td><td>Créer une parcelle vierge sans périmètre</td></tr>
<tr><td>🛰 / 🗺</td><td>Basculer fond satellite / OpenStreetMap</td></tr>
<tr><td>⋯ → 📍 Recentrer GPS</td><td>Recadrer si la carte est au mauvais endroit</td></tr></table>
<h3>Barre d'outils plan (mode Édition)</h3>
<table><tr><th>Outil</th><th>Action</th></tr>
<tr><td>🖱 Sélect.</td><td>Toucher un arbre → ouvre sa fiche</td></tr>
<tr><td>✋ Déplacer</td><td>Glisser-déposer les arbres</td></tr>
<tr><td>🗑 Retirer</td><td>Retire un arbre du plan (fiche intacte)</td></tr>
<tr><td>✏ Tracer / Valider</td><td>Tracé/modification du périmètre · 2e appui = valider</td></tr>
<tr><td>⬜ Effacer</td><td>Efface le périmètre et les positions (irréversible sauf ↩)</td></tr>
<tr><td>↩ Annuler</td><td>Annule le dernier placement, déplacement ou tracé</td></tr>
<tr><td>＋ / － / ⊡</td><td>Zoom avant / arrière / recadrage 100%</td></tr>
<tr><td>💾 Enreg.</td><td>Sauvegarde et repasse en mode Vue</td></tr>
<tr><td>📥 Télécharger</td><td>Export HTML : plan numéroté + légende + températures + interventions</td></tr></table>`},
    en:{title:'🌳 Orchards',anchor:'verger',body:`<p>Two-panel layout: compact IGN map (360 px) for plot selection, 2D SVG plan for drag-and-drop tree placement. Two modes: <strong>View</strong> (read-only with download) and <strong>Edit</strong> (full tools).</p><p><strong>Cadastral selection:</strong> press 🏚 once (crosshair appears), pan map to centre your plot, press 🏚 again. Navigate multiple results with ‹ › or type the visible number. Choose 🌳 New orchard or ✓ Apply to active tab.</p><p><strong>Freehand drawing:</strong> press ✏ Trace in Edit mode to draw your own boundary point by point. Tap a point to delete it. Press ✏ Validate or tap first point ⊕ to confirm. ⬜ Clear erases the boundary to start over.</p><p><strong>Plan tools:</strong> 🖱 sheets · ✋ move · 🗑 remove · ↩ undo · ＋－⊡ zoom · 💾 saves & switches to View · 📥 exports full HTML report with numbered plan, legend, temperature history and treatments.</p>`}
  },
  calendrier:{
    fr:{title:'📅 Calendrier',anchor:'calendrier',body:`
<p>Vue mensuelle de tous les événements de la collection. Les points colorés représentent les types d'événements (et les profils NPK pour les fertilisations).</p>
<h3>Utilisation</h3>
<p>Touchez un jour pour afficher le <strong>panneau de détail</strong> sous la grille — groupé par sujet, avec modifications de fiche en accordéon. Toucher le nom d'un sujet dans le panneau ouvre sa fiche.</p>
<h3>Filtres</h3>
<p>Chaque type peut être masqué/affiché individuellement via les pills. Les événements masqués restent visibles à 40% de transparence dans le panneau du jour.</p>
<p>Le type <strong>📝 Modifications de fiche</strong> regroupe toutes les entrées générées automatiquement par l'audit trail.</p>`},
    en:{title:'📅 Calendar',anchor:'calendrier',body:`<p>Monthly view of all collection events. Tap a day to show a detail panel below the grid, grouped by subject. Filter pills toggle event types individually.</p>`}
  },
  evenements:{
    fr:{title:'✏️ Événements & journal',anchor:'evenements',body:`
<p>Un événement documente une action culturale datée. 12 types disponibles, avec champs spécifiques selon le type.</p>
<table><tr><th>Type</th><th>Effets automatiques</th></tr>
<tr><td>❄️ Rentrée hivernage</td><td>Emplacement → intérieur</td></tr>
<tr><td>☀️ Sortie hivernage</td><td>Emplacement → extérieur</td></tr>
<tr><td>🪴 Rempotage</td><td>Met à jour le Ø du pot</td></tr>
<tr><td>💧 Arrosage</td><td>Réinitialise le compteur d'arrosage</td></tr></table>
<div class="info-box">Pour les jauges NPK : renseignez le <strong>poids en grammes</strong> ET sélectionnez un <strong>profil d'engrais</strong> sur chaque fertilisation.</div>`},
    en:{title:'✏️ Events & Log',anchor:'evenements',body:`<p>12 event types. Repotting updates pot size. Wintering/outside events auto-switch the location. For NPK gauges: weight in grams + NPK profile are both required.</p>`}
  },
  collection:{
    fr:{title:'🍋 Collection',anchor:'collection',body:`
<p>La collection affiche tous vos sujets en <strong>vue liste</strong> ou <strong>vue verger 2D</strong>.</p>
<h3>Cartes</h3>
<p>Chaque carte affiche : espèce, nom, variété, tags (pot, emplacement, photos, porte-greffe), statut sanitaire, délai d'arrosage coloré, et dernière T° enregistrée.</p>
<h3>Mode sélection multiple</h3>
<p>Bouton ☑ → séleplusieurs sujets → <em>Appliquer une action</em> pour fertilisation, arrosage, hivernage/sortie collectifs.</p>
<h3>Filtres</h3>
<p>Mode de culture (pot/pleine terre) + statut sanitaire + barre de recherche full-text.</p>`},
    en:{title:'🍋 Collection',anchor:'collection',body:`<p>List view or 2D Orchard view. Each card shows species, name, tags, status, watering countdown and last temperature. Use ☑ for bulk actions.</p>`}
  },
  securite:{
    fr:{title:'🔒 Sécurité',anchor:'securite',body:`
<p>Toutes vos données restent <strong>100% locales</strong> — rien n'est envoyé vers un serveur tiers.</p>
<table><tr><th>Élément</th><th>Méthode</th></tr>
<tr><td>Mot de passe</td><td>Hash SHA-256 (WebCrypto)</td></tr>
<tr><td>Token GitHub</td><td>Chiffrement XOR + SHA-256</td></tr>
<tr><td>E-mail récupération</td><td>Texte local uniquement</td></tr></table>
<div class="info-box">En cas de mot de passe oublié, touchez le lien sous le formulaire de connexion. Si un e-mail de récupération est configuré, il vous sera demandé pour confirmer votre identité.</div>
<p>GitHub est <strong>facultatif</strong> — l'application fonctionne intégralement sans.</p>`},
    en:{title:'🔒 Security',anchor:'securite',body:`<p>All data is 100% local. Password → SHA-256 hash. GitHub token → XOR+SHA-256. GitHub is optional. Recovery email is a local security question only — no messages sent.</p>`}
  },
  donnees:{
    fr:{title:'💾 Export & sauvegarde',anchor:'donnees',body:`
<p>Profil 🌿 → <em>⬇ Exporter JSON</em>. Télécharge l'intégralité de votre collection (plantes, événements, historiques, coordonnées GPS).</p>
<div class="warn-box">L'import <strong>écrase</strong> la collection existante. Exportez toujours avant d'importer.</div>
<p>Le localStorage est limité à ~5 Mo. Avec photos sur GitHub (URL uniquement en local), plusieurs centaines de sujets sont possibles.</p>`},
    en:{title:'💾 Export & Backup',anchor:'donnees',body:`<p>Profile 🌿 → Export JSON. Downloads full collection. Import replaces existing data — always export first. localStorage limit ~5 MB.</p>`}
  },
  fiche:{
    fr:{title:'📋 Fiche sujet',anchor:'fiche',body:`
<p>Ouvrez une fiche en touchant une carte. Touchez <strong>💾 Enregistrer</strong> pour fermer et revenir à la liste — les modifications sont tracées automatiquement.</p>
<h3>Audit trail</h3>
<p>19 champs sont comparés à l'enregistrement. Chaque différence génère une entrée <em>📝 Modification</em> dans le journal et le calendrier.</p>
<h3>Scanner passeport UE</h3>
<p>Bouton 📷 Scanner → vidéo temps réel (Chrome) ou import image. Zones lues : A (espèce), B (variété), C (porte-greffe/pays), D (agrément), E (n° lot).</p>
<h3>Recherche variété — sources intégrées</h3>
<p>Le champ Variété interroge en cascade plusieurs bases de référence internationale :</p>
<table>
<tr><th>Badge</th><th>Source</th><th>Contenu</th></tr>
<tr><td style="color:#2e7d32;font-weight:700">GCVC</td><td><a href="https://citrusvariety.ucr.edu/collection/" target="_blank" style="color:var(--blue)">Givaudan CVC / UCR</a></td><td>~1 100 cultivars historiques et commerciaux</td></tr>
<tr><td style="color:#1565c0;font-weight:700">MCCDD</td><td><a href="https://citrusvariety.ucr.edu/modern-citrus-cultivars-descriptive-database" target="_blank" style="color:var(--blue)">MCCDD / UCR</a></td><td>1 068 cultivars modernes (post-1931, IP incluse)</td></tr>
<tr><td style="color:#6a1b9a;font-weight:700">INRAE</td><td><a href="https://www6.montpellier.inrae.fr/agap/Ressources-genetiques/BRC-Citrus" target="_blank" style="color:var(--blue)">INRAE-CIRAD Corse</a></td><td>~800 génotypes méditerranéens (San Giuliano)</td></tr>
<tr><td style="color:#c77800;font-weight:700">GRIN</td><td><a href="https://www.ars-grin.gov/" target="_blank" style="color:var(--blue)">USDA GRIN-Global</a></td><td>API dynamique — +500 000 accessions</td></tr>
<tr><td style="color:#0097a7;font-weight:700">GBIF</td><td><a href="https://www.gbif.org/" target="_blank" style="color:var(--blue)">GBIF</a></td><td>API dynamique — taxonomie mondiale</td></tr>
</table>
<div class="info-box">Si la variété saisie est absente de toutes les bases, un avertissement <em>⚠ variété non référencée</em> s'affiche — la saisie libre reste toujours acceptée.</div>
<h3>Recherche espèce — GBIF</h3>
<p>Tapez dans le champ Espèce — suggestions GBIF après 350 ms de pause (debounce). Voir aussi <a href="https://gd.eppo.int/taxon/1CIDG" target="_blank" style="color:var(--blue)">EPPO Global Database</a> pour la nomenclature européenne officielle.</p>`},
    en:{title:'📋 Subject Record',anchor:'fiche',body:`<p>Tap Save to close and return to collection. 19 fields are audited automatically. Use the barcode scanner for EU phytosanitary passports.</p><h3>Variety databases</h3><p>The Variety field searches: <strong>GCVC/UCR</strong> (~1,100 cultivars), <strong>MCCDD/UCR</strong> (1,068 modern cultivars with IP), <strong>INRAE-CIRAD</strong> (~800 Mediterranean genotypes), then <strong>USDA GRIN</strong> and <strong>GBIF</strong> via API. An "⚠ not referenced" warning appears if absent from all sources — free entry always accepted.</p>`}
  },
  brix:{
    fr:{title:'🧪 Suivi Brix & acidité',anchor:'brix',body:`
<p>Visible dans le formulaire d'événement lorsque le type <strong>🧺 Récolte</strong> est sélectionné.</p>
<h3>Champs disponibles</h3>
<table>
<tr><th>Champ</th><th>Unité</th><th>Description</th></tr>
<tr><td>°Brix</td><td>°Brix</td><td>Teneur en sucres — réfractomètre (~15 €) sur jus frais</td></tr>
<tr><td>Acidité titrable</td><td>g/L</td><td>Équivalent acide citrique</td></tr>
<tr><td>Ratio Brix/Acidité</td><td>—</td><td>Calculé automatiquement · badge qualité</td></tr>
<tr><td>Quantité</td><td>kg</td><td>Poids total récolté</td></tr>
<tr><td>Stade</td><td>—</td><td>Vert · Tournant · Optimal · Surmature</td></tr>
</table>
<h3>Interprétation du ratio</h3>
<table>
<tr><th>Ratio</th><th>Qualité</th></tr>
<tr><td>&lt; 6</td><td>🔴 Acide</td></tr>
<tr><td>6–9</td><td>🟠 Pré-maturité</td></tr>
<tr><td>9–15</td><td>🟢 Optimal</td></tr>
<tr><td>&gt; 15</td><td>🔵 Surmature</td></tr>
</table>
<div class="info-box">Les données sont conservées sur l'événement et affichées sous forme de badges dans le journal et le calendrier.</div>`},
    en:{title:'🧪 Brix & Acidity Tracking',anchor:'brix',body:`<p>Available in the event form when the <strong>🧺 Harvest</strong> type is selected. Fields: °Brix (refractometer), titratable acidity (g/L), auto-calculated Brix/Acidity ratio with quality badge, quantity (kg), ripeness stage.</p><p>Ratio ranges: &lt;6 Acid · 6–9 Pre-ripening · 9–15 Optimal · &gt;15 Over-ripe.</p>`}
  },
  diagnostic:{
    fr:{title:'🔬 Diagnostic phytosanitaire',anchor:'diagnostic',body:`
<p>Accès via le bouton <strong>🔬</strong> flottant dans chaque fiche sujet. Le panneau slide-up guide en 3 étapes.</p>
<h3>Étapes</h3>
<ol style="padding-left:16px;margin:6px 0">
<li><strong>Photo</strong> — galerie de la fiche, prise de vue ou import fichier</li>
<li><strong>Contexte</strong> — zone (feuille / rameau / fruit / tronc / racine) + symptôme principal · sélecteur âge feuilles pour les carences</li>
<li><strong>Résultat</strong> — condition identifiée, score de confiance, traitement, sources scientifiques</li>
</ol>
<h3>Deux moteurs</h3>
<table>
<tr><th>Moteur</th><th>Prérequis</th><th>Précision</th></tr>
<tr><td>Heuristique local</td><td>Aucun (offline)</td><td>~65 %</td></tr>
<tr><td>Claude Vision IA</td><td>Clé API dans Profil 🌿</td><td>~85 %</td></tr>
</table>
<h3>Limitations importantes</h3>
<div class="warn-box">Ce module est une <strong>aide à l'identification</strong>, non un diagnostic certifié. Les virus (HLB, Tristeza, Chancre) ne peuvent être confirmés que par test de laboratoire agréé. Chaque résultat inclut les sources scientifiques de référence (EPPO, EFSA, ANSES, CABI).</div>
<h3>Actions disponibles</h3>
<p>💊 Créer traitement · 📋 Mettre en vigilance · 📎 Sauvegarder comme observation. L'historique des diagnostics est consultable dans la fiche sujet.</p>`},
    en:{title:'🔬 Plant Health Diagnosis',anchor:'diagnostic',body:`<p>Access via the floating <strong>🔬</strong> button in each subject record. 3-step panel: Photo → Context (zone + symptom + leaf age) → Result.</p><p>Two engines: local heuristic (offline, ~65%) or Claude Vision AI (API key in Profile, ~85%). Virus conditions (HLB, Tristeza, Canker) are capped at 30% confidence — lab confirmation required. Each result links to EPPO, EFSA, ANSES and CABI reference sheets.</p>`}
  },
  connaissances:{
    fr:{title:'📚 Fiche culturale (base KB)',anchor:'connaissances',body:`
<p>Chaque fiche sujet affiche une section <strong>📚 Fiche culturale</strong> sous l'identification botanique, avec les données de référence propres à l'espèce.</p>
<h3>Blocs affichés</h3>
<table>
<tr><th>Bloc</th><th>Contenu</th></tr>
<tr><td>❄ Rusticité</td><td>T° létale, seuil risque, hivernage, niveau 1–4</td></tr>
<tr><td>⛰ Sol</td><td>pH min/max/optimal (barre), texture, M.O.</td></tr>
<tr><td>🌱 NPK</td><td>Barres N/P/K/Mg/Fe, mois fertilisation, comparaison profil actif</td></tr>
<tr><td>✂ Taille</td><td>Calendrier 12 mois — 🟢 idéal · 🟡 acceptable · 🔴 déconseillé</td></tr>
<tr><td>🐛 Ravageurs</td><td>Top 5 avec risque et période, bouton "Consigner traitement"</td></tr>
<tr><td>🌸 Phénologie</td><td>Floraison / récolte, remontant, estimation 1ʳᵉ récolte</td></tr>
<tr><td>🌿 Porte-greffes</td><td>Recommandés, pour pot, argile, calcaire</td></tr>
</table>
<div class="info-box">Sources : UCR Givaudan CVC · INRAE BRC-Citrus · USDA GRIN. Données statiques — compatibilité offline totale. 22 espèces couvertes.</div>
<h3>Alertes tableau de bord</h3>
<p>Le tableau de bord signale automatiquement les ravageurs en période de risque élevé ce mois et les tailles recommandées, avec lien direct vers la fiche concernée.</p>`},
    en:{title:'📚 Cultural Reference (KB)',anchor:'connaissances',body:`<p>Each subject record shows a <strong>📚 Cultural guide</strong> section under botanical ID with species-specific data: frost hardiness, soil/pH, NPK profiles, pruning calendar, top 5 pests with seasonal risk, phenology bar, and recommended rootstocks. 22 species covered. Sources: UCR CVC · INRAE · USDA GRIN.</p>`}
  },
  greffage:{
    fr:{title:'🌿 Greffage — registre',anchor:'greffage',body:`
<p>Le type d'événement <strong>🌿 Greffage</strong> couvre l'ensemble du cycle pépiniériste : combinaison greffon × porte-greffe, gestion de cohorte (lot), suivi de reprise et durée d'élevage.</p>
<h3>Champs du panneau greffage</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>Méthode</td><td>Écusson · Fente · En couronne · Chip-budding · Approche</td></tr>
<tr><td>Greffon</td><td>Espèce / variété prélevée (autocomplétion SP[])</td></tr>
<tr><td>Porte-greffe</td><td>Pré-rempli depuis la fiche, modifiable</td></tr>
<tr><td>Stade phénologique</td><td>Repos · Gonflement · Débourrement · Feuillaison</td></tr>
<tr><td>Lot ID</td><td>Auto-généré LOT-AAAA-MM-XXX, modifiable librement</td></tr>
<tr><td>Quantité</td><td>Nombre de greffons dans le lot</td></tr>
<tr><td>Origine</td><td>Collection propre · Achat · Échange</td></tr>
<tr><td>Reprise (%)</td><td>Taux observé — peut être renseigné plus tard via <em>Enregistrer la reprise</em></td></tr>
<tr><td>Élevage (semaines)</td><td>Durée estimée → date de disponibilité calculée automatiquement</td></tr>
</table>
<h3>Enregistrer la reprise</h3>
<p>Le bouton <em>Enregistrer la reprise</em> dans le journal permet de compléter le taux de reprise sur un greffage existant sans créer un nouvel événement.</p>
<h3>Registre des greffages</h3>
<p>La fiche sujet affiche un tableau récapitulatif de tous les lots avec taux de reprise moyen et stock en cours d'élevage.</p>`},
    en:{title:'🌿 Grafting — registry',anchor:'greffage',body:`<p>The <strong>🌿 Grafting</strong> event type covers the full nursery cycle: scion × rootstock combination, batch management, take rate tracking and growing period.</p><p>Fields: method (T-budding, cleft, crown, chip, approach), scion species (SP[] autocomplete), rootstock (pre-filled from record), lot ID (auto-generated), quantity, origin, take rate (%), growing period in weeks → estimated availability date. The "Record take" button on existing entries lets you update the take rate without creating a new event.</p>`}
  },
  pepiniere:{
    fr:{title:'🌱 Module Pépinière',anchor:'pepiniere',body:`
<p>Le module Pépinière couvre la chaîne complète de production : semis, catalogue de vente et commandes clients. Accessible via Profil 🌿 → onglet <strong>🌱 Pépinière</strong>.</p>
<h3>3 sous-onglets</h3>
<table>
<tr><th>Onglet</th><th>Contenu</th></tr>
<tr><td>🌱 Semis</td><td>Date, espèce, substrat, quantité, taux de germination, date de repiquage</td></tr>
<tr><td>🌿 Catalogue</td><td>Plants disponibles à la vente — espèce, porte-greffe, Ø pot, quantité, prix, marge</td></tr>
<tr><td>📦 Commandes</td><td>Suivi client — articles, statut (En attente / Livrée / Annulée), total automatique</td></tr>
</table>
<div class="info-box">La livraison d'une commande décrémente automatiquement le stock catalogue. Les lots de greffage disponibles (< 14 jours) alimentent le catalogue via <em>🌿 Sync. greffage</em>.</div>
<h3>Étiquettes PDF</h3>
<p>Bouton <em>Étiquettes PDF</em> dans le catalogue — grille d'étiquettes 160px avec QR SVG, espèce, variété, porte-greffe, taille de pot et prix. Imprimable directement.</p>`},
    en:{title:'🌱 Nursery Module',anchor:'pepiniere',body:`<p>Profile 🌿 → <strong>🌱 Nursery</strong> tab. Three sub-tabs: Seedlings (germination tracking), Catalog (plants for sale with price/margin), Orders (customer tracking with auto stock deduction on delivery). Graft lots available within 14 days auto-sync to catalog. Label PDF generates a printable grid with SVG QR codes.</p>`}
  },
  _:{
    fr:{title:'',anchor:'equipe',body:`
<p>Le module Équipe permet d'assigner des tâches à des opérateurs et de suivre leur réalisation. Accessible via Profil 🌿 → onglet <strong>👥 Équipe</strong>.</p>
<h3>3 sous-onglets</h3>
<table>
<tr><th>Onglet</th><th>Contenu</th></tr>
<tr><td>📋 Tâches</td><td>Liste triée (en retard en premier), boutons ✓ Terminée / Ignorer / Modifier</td></tr>
<tr><td>📅 Semaine</td><td>Grille 7 colonnes avec points colorés par opérateur, récap en attente/terminées</td></tr>
<tr><td>👤 Opérateurs</td><td>Nom, rôle (Propriétaire/Opérateur/Lecteur), couleur, PIN SHA-256</td></tr>
</table>
<h3>Alertes tableau de bord</h3>
<p>Les tâches en retard (échéance dépassée) apparaissent dans un bloc <em>⏰ Tâches en retard</em> sur le tableau de bord avec lien direct vers l'onglet Équipe.</p>
<h3>Export & partage</h3>
<p><em>Récap hebdo PDF</em> — rapport KPIs + tableau par opérateur + journal complet de la semaine.<br/><em>Fiche publique</em> — HTML autonome téléchargeable pour un sujet (galerie + événements), depuis la fiche sujet.</p>`},
    en:{title:'👥 Team Module',anchor:'equipe',body:`<p>Profile 🌿 → <strong>👥 Team</strong> tab. Three sub-tabs: Tasks (sorted by overdue first, with Done/Skip/Edit buttons), Week (7-column grid with colour-coded dots per operator), Operators (name, role, colour, PIN). Overdue tasks appear in a dashboard alert block. Weekly PDF summary available. Public card exports a standalone HTML file for any subject.</p>`}
  },
  greffes:{
    fr:{title:'✂️ Fiches Greffes',anchor:'pepiniere',body:`
<p>Créez des <strong>fiches de lot de greffage</strong> directement dans la Pépinière (🌿 Pro → 🌱 Pépinière → onglet ✂️ Greffes), sans passer par la fiche d'un sujet.</p>
<h3>Structure d'une fiche</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>🌳 Porte-greffe</td><td>Espèce (liste SP) + quantité totale</td></tr>
<tr><td>Date · Méthode</td><td>Écusson · Fente · En couronne · Chip-budding · Approche · Autre</td></tr>
<tr><td>Statut global</td><td>En cours · Reprise OK · Disponible · Perdu</td></tr>
<tr><td>Greffons</td><td>Lignes dynamiques — ajouter/supprimer à volonté</td></tr>
</table>
<h3>Par greffon</h3>
<p>Espèce, variété (saisie libre), quantité greffée, taux de reprise %, quantité de reprises, date de disponibilité.</p>
<h3>Barre de progression</h3>
<p>Affichée sur chaque carte : reprises / total greffés, colorée selon le taux (vert ≥70 %, orange ≥40 %, rouge &lt;40 %).</p>
<h3>→ Catalogue</h3>
<p>Bouton par greffon ayant des reprises — pousse directement vers le Catalogue avec espèce, porte-greffe et quantité pré-remplis.</p>`},
    en:{title:'✂️ Graft Records',anchor:'pepiniere',body:`<p>Create graft batch records directly in the Nursery tab (🌿 Pro → 🌱 Nursery → ✂️ Grafts). Each record = 1 rootstock × N scions. Per scion: species, variety, qty grafted, take rate %, qty taken, availability date. Progress bar shows take rate per record. "→ Catalog" button pushes a scion batch to the catalog.</p>`}
  },
  sync:{
    fr:{title:'☁ Synchronisation',anchor:'sync',body:`
<p>Synchronisez vos données entre plusieurs appareils via un dépôt <strong>GitHub Gist privé</strong> ou un serveur <strong>WebDAV/Nextcloud</strong>.</p>
<div class="warn-box">Vos données sont <strong>chiffrées sur votre appareil</strong> (AES-256-GCM, clé dérivée de votre mot de passe via PBKDF2) avant tout envoi. Votre fournisseur ne peut pas les lire.</div>
<h3>Accès</h3>
<p>⚙ Réglages → onglet <strong>☁ Sync</strong>.</p>
<h3>Token Gist — classic PAT obligatoire</h3>
<div class="warn-box"><strong>⚠ Les fine-grained PATs (<code>github_pat_…</code>) ne sont pas compatibles avec l'API Gist.</strong> Utilisez un <strong>classic PAT</strong> (<code>ghp_…</code>) dédié à la synchronisation.</div>
<p><strong>Créer un classic PAT :</strong></p>
<ol style="padding-left:18px;font-size:.88rem;line-height:2">
  <li>github.com → <em>Settings → Developer settings → Personal access tokens → Tokens (classic)</em></li>
  <li>Cliquez <strong>Generate new token (classic)</strong></li>
  <li>Cochez uniquement le scope <strong>gist</strong></li>
  <li>Générez et copiez le token (<code>ghp_…</code>)</li>
  <li>Dans l'app : ⚙ Réglages → ☁ Sync → champ <strong>Token Gist dédié</strong> → collez → <strong>Enregistrer la configuration</strong></li>
</ol>
<h3>Providers disponibles</h3>
<table>
<tr><th>Provider</th><th>Prérequis</th></tr>
<tr><td>GitHub Gist privé</td><td>Classic PAT (<code>ghp_…</code>) dans le champ "Token Gist dédié"</td></tr>
<tr><td>WebDAV / Nextcloud</td><td>URL, identifiant, mot de passe WebDAV</td></tr>
<tr><td>Les deux</td><td>Double sauvegarde simultanée</td></tr>
</table>
<h3>Résolution de conflits</h3>
<p>Si la version distante est plus récente de plus de 60 secondes, un dialogue propose de choisir entre la version locale et la version distante.</p>
<h3>Données synchronisées</h3>
<p>Toutes les clés localStorage (collection, config, pépinière, équipe, stocks, clients, eau…) sauf les secrets : hash mot de passe, tokens API, token Gist dédié.</p>`},
    en:{title:'☁ Sync',anchor:'sync',body:`
<p>Sync data across devices via a private <strong>GitHub Gist</strong> or <strong>WebDAV/Nextcloud</strong> server. Data is encrypted client-side with AES-256-GCM (PBKDF2-derived key) before upload — your provider cannot read it.</p>
<div class="warn-box"><strong>⚠ Fine-grained PATs (<code>github_pat_…</code>) are NOT compatible with the Gist API.</strong> You must use a <strong>classic PAT</strong> (<code>ghp_…</code>) in the dedicated "Gist Token" field.</div>
<p><strong>Create a classic PAT:</strong> github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → check only the <strong>gist</strong> scope → copy the token → Settings → ☁ Sync → <strong>Dedicated Gist Token</strong> field → Save.</p>
<p>Settings → ☁ Sync tab. Conflict resolution dialog when remote version is &gt;60s newer. Secrets (password hash, API tokens, Gist token) are never synced — each device keeps its own.</p>`}
  },
  gjc:{
    fr:{title:'🌡 Phénologie & Degrés-Jours',anchor:'meteo',body:`
<p>Le bloc phénologie calcule les <strong>Degrés-Jours de Croissance (GJC)</strong> et les <strong>heures de froid</strong> sur les 7 jours de prévision Open-Meteo.</p>
<h3>Degrés-Jours de Croissance</h3>
<div class="formula">GJC = max(0, (Tmax + Tmin) / 2 − 10°C)</div>
<p>Base 10°C — seuil de croissance active de la plupart des agrumes. Cumulés par jour de prévision.</p>
<h3>Heures de froid</h3>
<p>Heures &lt;7°C dans les prévisions horaires. Indicateur de dormance hivernale : 800–1 200h de froid sont nécessaires pour certaines variétés tempérées.</p>
<h3>Messages phénologiques indicatifs</h3>
<table>
<tr><th>GJC cumulé saison</th><th>Stade indicatif</th></tr>
<tr><td>&lt;200</td><td>🌸 Pré-floraison / débourrement</td></tr>
<tr><td>200–400</td><td>🌸 Floraison espèces précoces</td></tr>
<tr><td>400–700</td><td>🍋 Nouaison & développement fruits</td></tr>
<tr><td>700–1000</td><td>🍊 Véraison variétés précoces</td></tr>
<tr><td>&gt;1000</td><td>🟠 Maturité en cours</td></tr>
</table>
<div class="info-box">Ces indicateurs sont estimatifs — les conditions locales (microclimat, variété, porte-greffe) influencent significativement la phénologie réelle.</div>`},
    en:{title:'🌡 Phenology & Growing Degree Days',anchor:'meteo',body:`<p>GDD (base 10°C) and chilling hours (&lt;7°C) computed from Open-Meteo 7-day forecast. GDD = max(0, (Tmax+Tmin)/2 − 10). Indicative phenological message shown based on seasonal cumulative GDD.</p>`}
  },
  ift:{
    fr:{title:'📊 IFT — Indicateur de Fréquence',anchor:'phyto',body:`
<p>L'<strong>IFT</strong> (Indicateur de Fréquence de Traitement) mesure l'intensité du recours aux produits phytosanitaires.</p>
<h3>Calcul</h3>
<div class="formula">IFT = Σ (dose appliquée / dose de référence) par surface</div>
<p>Renseignez <strong>dose (L/ha)</strong> et <strong>surface (ha)</strong> sur chaque événement Traitement pour affiner le calcul.</p>
<h3>Interprétation</h3>
<table>
<tr><th>IFT normalisé</th><th>Niveau</th></tr>
<tr><td>&lt;1,5</td><td style="color:#2e7d32">🟢 Faible</td></tr>
<tr><td>1,5–3</td><td style="color:#e65100">🟠 Modéré</td></tr>
<tr><td>&gt;3</td><td style="color:#c62828">🔴 Élevé</td></tr>
</table>
<p>L'IFT sert de référence pour les démarches HVE niveau 3 et les dossiers PAC/FEADER. Il est calculé séparément hors herbicides dans la norme MSA/RICA complète.</p>
<div class="info-box">Pour un IFT certifiable, renseignez systématiquement dose et surface sur chaque traitement.</div>`},
    en:{title:'📊 TFI — Treatment Frequency Index',anchor:'phyto',body:`<p>TFI = Σ (applied dose / reference dose) per area. Set dose (L/ha) and surface (ha) on each Treatment event to calculate. TFI &lt;1.5 = low, 1.5–3 = moderate, &gt;3 = high. Used for HVE level 3 and CAP/EAFRD applications.</p>`}
  },
  pepiniere_dashboard:{
    fr:{title:'📊 Dashboard Pépinière',anchor:'pepiniere',body:`
<p>Le tableau de bord pépinière centralise les indicateurs de production en temps réel.</p>
<h3>KPIs principaux</h3>
<table>
<tr><th>Indicateur</th><th>Calcul</th></tr>
<tr><td>Plants disponibles</td><td>Somme des qtyAvail dans le catalogue</td></tr>
<tr><td>En élevage</td><td>Greffons actifs (statut En cours × quantité greffée)</td></tr>
<tr><td>Commandes en cours</td><td>Commandes au statut "En attente"</td></tr>
<tr><td>CA cumulé</td><td>Somme des commandes livrées (× prix unitaire)</td></tr>
</table>
<h3>Coût de revient</h3>
<p>Estimé en divisant les charges intrants+eau+main d'œuvre de la saison par le nombre de plants vendus. Renseignez vos charges dans <strong>⚖️ Budget</strong> pour l'activer.</p>
<h3>Alertes automatiques</h3>
<ul style="padding-left:18px;line-height:1.9;font-size:.9rem">
<li>🟢 Lots disponibles dans 30j — plants à sortir du catalogue</li>
<li>⏰ Commandes en retard sur date de livraison</li>
<li>📉 Références en stock bas (sous le seuil d'alerte)</li>
</ul>`},
    en:{title:'📊 Nursery Dashboard',anchor:'pepiniere',body:`<p>Real-time production KPIs: available plants, seedlings in nursery, pending orders, cumulative revenue. Cost per plant estimated from season charges / plants sold. Automatic alerts: lots ready in 30d, overdue deliveries, low stock.</p>`}
  },
  pepiniere_planning:{
    fr:{title:'📅 Planning de production',anchor:'pepiniere',body:`
<p>Le planning inversé calcule les dates de semis et greffe à partir de la <strong>date de disponibilité cible</strong>.</p>
<h3>Logique de calcul</h3>
<div class="formula">Date de semis = Date dispo − délai production (mois)
Date de greffe = Date dispo − (délai − 6 mois)</div>
<h3>Délais indicatifs par espèce</h3>
<table>
<tr><th>Espèce</th><th>Délai production</th></tr>
<tr><td>Citrus limon / reticulata</td><td>18 mois</td></tr>
<tr><td>Citrus sinensis / paradisi</td><td>24 mois</td></tr>
<tr><td>Fortunella margarita</td><td>14 mois</td></tr>
<tr><td>Poncirus trifoliata</td><td>36 mois</td></tr>
</table>
<p>Personnalisez le délai via le champ <strong>Age plant (mois)</strong> dans chaque référence catalogue.</p>
<div class="info-box">La section "Commandes avec date livraison" affiche les commandes avec délai restant — en vert (>30j), orange (<30j) ou rouge (en retard).</div>`},
    en:{title:'📅 Production Planning',anchor:'pepiniere',body:`<p>Reverse planning: computes required sowing and grafting dates from target availability. Delays by species (limon 18m, sinensis 24m, Fortunella 14m, Poncirus 36m). Customize via the "Plant age (months)" field in each catalog reference. Orders section shows delivery countdown per customer.</p>`}
  },
  pepiniere_clients:{
    fr:{title:'👤 CRM Clients',anchor:'pepiniere',body:`
<p>Gérez vos relations clients directement depuis la Pépinière (onglet <strong>👤 Clients</strong>).</p>
<h3>Fiche client</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>Nom / Raison sociale</td><td>Obligatoire</td></tr>
<tr><td>Type</td><td>👤 Particulier · 🏢 Professionnel · 🏛 Collectivité</td></tr>
<tr><td>Téléphone / E-mail</td><td>Contact principal</td></tr>
<tr><td>Adresse</td><td>Pour les livraisons</td></tr>
<tr><td>Préférences / Notes</td><td>Variétés souhaitées, informations utiles</td></tr>
</table>
<h3>Historique CA</h3>
<p>Le CA total est calculé automatiquement à partir des commandes livrées (status = done) dont le champ <em>clientName</em> correspond au nom du client.</p>`},
    en:{title:'👤 Customer CRM',anchor:'pepiniere',body:`<p>Profile 🌿 → 🌱 Nursery → 👤 Clients tab. Customer records: name, type (private/pro/institution), phone, email, address, notes. Cumulative revenue computed automatically from delivered orders matching the client name. Pending orders shown per client.</p>`}
  },
  pepiniere_rentabilite:{
    fr:{title:'📈 Rentabilité variétale',anchor:'pepiniere',body:`
<p>Classement de vos références par chiffre d'affaires réalisé et analyse des marges.</p>
<h3>Indicateurs par référence</h3>
<table>
<tr><th>Indicateur</th><th>Source</th></tr>
<tr><td>Prix de vente</td><td>Champ "Prix" du catalogue</td></tr>
<tr><td>Marge %</td><td>Champ "Marge" du catalogue</td></tr>
<tr><td>Marge €</td><td>Prix × (1 − marge%/100)</td></tr>
<tr><td>Plants vendus</td><td>Somme des quantités sur commandes livrées</td></tr>
<tr><td>CA total</td><td>Qty vendus × prix unitaire moyen</td></tr>
</table>
<h3>Certification</h3>
<p>Le badge de certification (CAC, DRS, SOV, bio) est affiché sur chaque ligne. Renseignez la certification dans le catalogue pour qu'elle apparaisse sur les étiquettes et les passeports plants.</p>`},
    en:{title:'📈 Variety Profitability',anchor:'pepiniere',body:`<p>Ranking of catalog references by revenue. Indicators per reference: sale price, margin %, margin €, units sold, total revenue. Certification badge (CAC/DRS/SOV/bio) shown per line. Set certification in catalog modal to include on labels and plant passports.</p>`}
  },
  eau:{
    fr:{title:"💧 Qualité de l'eau",anchor:'eau',body:`
<p>Suivez la qualité de votre eau d'irrigation — critique pour les agrumes en pot très sensibles au calcaire.</p>
<h3>Indicateurs</h3>
<table>
<tr><th>Paramètre</th><th>Valeur cible agrumes</th><th>Impact si hors plage</th></tr>
<tr><td>pH</td><td>5,5 – 7,0</td><td>pH &gt;7,5 → chlorose ferrique. pH &lt;5 → acidité excessive</td></tr>
<tr><td>EC (mS/cm)</td><td>&lt;1,5</td><td>EC &gt;1,5 → accumulation sels → brûlures racinaires</td></tr>
<tr><td>Dureté (°f)</td><td>&lt;20°f</td><td>&gt;20°f = eau calcaire → colmatage substrat, élévation pH</td></tr>
</table>
<h3>Corrections recommandées</h3>
<ul style="padding-left:18px;line-height:1.9;font-size:.9rem">
<li><strong>pH trop élevé :</strong> acidification avec acide phosphorique dilué ou acide citrique, ou mélange eau de pluie</li>
<li><strong>EC élevée :</strong> eau osmosée ou eau de pluie, lessivage périodique du substrat</li>
<li><strong>Dureté forte :</strong> filtration ou mélange avec eau de pluie collectée</li>
</ul>
<h3>Saisir un relevé</h3>
<p>🌿 Pro → 🌱 Pépinière → onglet <strong>💧 Eau</strong> → bouton <em>💧 ＋ Nouveau relevé</em>.</p>`},
    en:{title:'💧 Water Quality',anchor:'pepiniere',body:`<p>Track irrigation water quality — critical for potted citrus sensitive to calcium. Target values: pH 5.5–7.0, EC &lt;1.5 mS/cm, hardness &lt;20°f. Corrections: phosphoric acid for high pH, rainwater for high EC/hardness. Log readings under 🌿 Pro → 🌱 Nursery → 💧 Water tab.</p>`}
  },
  eco_tendances:{
    fr:{title:'📈 Tendances économiques',anchor:'eco',body:`
<p>L'onglet <strong>📈 Tendances</strong> dans la Gestion offre une vision multi-années de votre exploitation.</p>
<h3>P&L multi-années</h3>
<p>Graphe en barres horizontales : charges (rouge) et recettes (vert) par saison. Tableau synthèse avec marge totale et marge par sujet.</p>
<h3>Répartition des charges</h3>
<p>Camembert textuel des postes de coûts (intrants, eau, main d'œuvre…) sur toutes les années.</p>
<h3>Bilan carbone simplifié</h3>
<p>Estimation indicative des émissions CO₂ équivalent selon les <strong>facteurs ADEME</strong> par catégorie de charge :</p>
<table>
<tr><th>Catégorie</th><th>Facteur (kgCO₂eq/€)</th></tr>
<tr><td>Intrants (engrais)</td><td>2,0</td></tr>
<tr><td>Eau</td><td>0,05</td></tr>
<tr><td>Main d'œuvre</td><td>0,3</td></tr>
<tr><td>Phyto</td><td>2,5</td></tr>
<tr><td>Autre</td><td>0,5</td></tr>
</table>
<div class="warn-box">Cette estimation est indicative et non certifiable. Utilisez-la comme outil de pilotage interne, pas comme donnée officielle.</div>
<h3>Export CSV</h3>
<p>Bouton <em>⬇ CSV toutes années</em> — export complet en UTF-8 compatible Excel.</p>`},
    en:{title:'📈 Economic Trends',anchor:'eco',body:`<p>Multi-year P&L: horizontal bar chart (charges red / revenues green per season), summary table with total and per-tree margin, cost breakdown. Simplified carbon footprint using ADEME emission factors per expense category. CSV export available.</p>`}
  },
  conservatoire:{
    fr:{title:'🏛 Espace Conservatoire',anchor:'conservatoire',body:`
<p>L'espace Conservatoire regroupe les outils spécifiques aux collections institutionnelles de plantes vivantes.</p>
<h3>📋 Accessions</h3>
<p>Chaque sujet peut recevoir un <strong>numéro d'accession</strong> au format <code>YYYY-NNNN</code> (ex : 2024-0042), assigné manuellement ou généré automatiquement depuis la fiche plante. Ce numéro est la clé d'identification unique dans la collection.</p>
<p>Champs complémentaires disponibles sur chaque fiche :</p>
<ul><li><strong>Statut IUCN</strong> : LC, NT, VU, EN, CR, EW, EX</li>
<li><strong>Statut de conservation</strong> : Vivant, Perdu, En dépôt, Prêté</li>
<li><strong>Provenance</strong> : pays, région, collecteur, institution donatrice</li></ul>
<h3>🔄 Échanges inter-institutions</h3>
<p>Enregistrez les prêts, dépôts, échanges et cessions avec les institutions partenaires : institution, contact, accession concernée, dates de sortie et retour prévu, statut (En cours / Retourné / Annulé).</p>
<h3>🌿 Vue taxonomique</h3>
<p>Navigation hiérarchique de la collection : Famille → Genre → Espèce → Cultivar, avec indicateurs IUCN par sujet et accès direct à chaque fiche.</p>
<h3>📤 Export BGCI</h3>
<p>Génère un CSV au format <strong>BGCI PlantSearch</strong> (accession, taxon complet, provenance, statut IUCN, coordonnées GPS optionnelles) directement importable dans les bases de données de conservation internationale.</p>
<h3>🏷 Étiquettes muséales PDF</h3>
<p>Génère des étiquettes de collection imprimables : numéro d'accession, binomial en italique, famille, porte-greffe, provenance, institution. Format A4 multi-colonnes, compatible plastification.</p>`},
    en:{title:'🏛 Conservatory Space',anchor:'conservatoire',body:`<p>Institutional living collection tools: accession register (YYYY-NNNN format), IUCN & conservation status, provenance tracking, inter-institution exchange log, taxonomic tree view (Family→Genus→Species→Cultivar), BGCI PlantSearch CSV export, and museum label PDF generation.</p>`}
  },
  wishlist:{
    fr:{title:'🌱 Wishlist — Acquisitions souhaitées',anchor:'wishlist',body:`
<p>La Wishlist permet de suivre les espèces et cultivars que vous souhaitez acquérir pour votre collection.</p>
<h3>Priorité</h3>
<ul><li>🔴 <strong>Haute</strong> — recherche active</li>
<li>🟡 <strong>Moyenne</strong> — opportuniste</li>
<li>🟢 <strong>Basse</strong> — si occasion se présente</li></ul>
<h3>Statuts</h3>
<ul><li><strong>Souhaité</strong> — désir initial</li>
<li><strong>En recherche</strong> — démarche active auprès de fournisseurs</li>
<li><strong>Trouvé</strong> — source identifiée, acquisition en cours</li>
<li><strong>Acquis</strong> — plante intégrée à la collection (archivé)</li></ul>
<div class="info-box">Les souhaits haute priorité apparaissent en tête de liste et dans un widget dédié sur votre tableau de bord. Cliquez ✓ pour marquer comme acquis.</div>`},
    en:{title:'🌱 Wishlist',anchor:'wishlist',body:`<p>Track desired species and cultivars: priority (high/medium/low), source/supplier, max budget, status (wanted → searching → found → acquired). High-priority items appear as a dashboard widget. Click ✓ to archive as acquired.</p>`}
  },
  saisonniers:{
    fr:{title:'🌾 Saisonniers & CDD',anchor:'saisonniers',body:`
<p>Gérez vos contrats de travail temporaire : CDD, CDI Intermittent, Intérimaires, Bénévoles.</p>
<ul>
<li><strong>Masse salariale</strong> calculée automatiquement (taux horaire × h/sem × durée)</li>
<li><strong>N° MSA / DUE</strong> : renseignez la Déclaration Unique d'Embauche MSA</li>
<li><strong>Export CSV</strong> compatible tableurs RH et pré-remplissage MSA</li>
</ul>
<div class="info-box">Les contrats terminés sont conservés pour archivage. L'export CSV contient nom, prénom, DDN, poste, taux, heures, salaire estimé et n° DUE.</div>`},
    en:{title:'🌾 Seasonal Workers',anchor:'saisonniers',body:'<p>Track fixed-term and seasonal employment contracts. Auto-calculates wage bill. CSV export with name, DOB, role, hourly rate, hours, estimated salary and MSA registration number.</p>'}
  },
  hve:{
    fr:{title:'🌿 Bilan HVE Auto-évalué',anchor:'hve',body:`
<p>Le <strong>bilan HVE</strong> calcule automatiquement votre score sur les 4 piliers de la Haute Valeur Environnementale à partir de vos données de collection.</p>
<ul>
<li><strong>Pilier A — Biodiversité</strong> : espèces patrimoniales (IUCN), diversité variétale</li>
<li><strong>Pilier B — Stratégie phyto</strong> : IFT herbicides ≤ réf × 30% · IFT hors herb ≤ réf × 50%</li>
<li><strong>Pilier C — Fertilisation</strong> : PPF établi, surplus N < 30 kg</li>
<li><strong>Pilier D — Irrigation</strong> : ETP ou IoT actif, relevés qualité eau</li>
</ul>
<p><strong>HVE3</strong> : ≥ 10/16 pts · <strong>HVE4</strong> : ≥ 13/16 + piliers B et C à 4/4</p>
<div class="info-box">Résultat indicatif uniquement — un audit par un organisme certifié agréé est obligatoire pour la certification officielle.</div>`},
    en:{title:'🌿 HVE Auto-Assessment',anchor:'hve',body:'<p>Automatically calculates your HVE score across 4 pillars from collection data. Pillar A: Biodiversity. Pillar B: Phyto strategy (TFI). Pillar C: Fertilisation (PPF + N surplus). Pillar D: Irrigation (ETP/IoT + water records). HVE3: ≥10/16 · HVE4: ≥13/16 with B and C at max. Indicative only — official certification requires an accredited auditor.</p>'}
  },
  certifications:{
    fr:{title:'🏅 Certifications',anchor:'certifications',body:`
<p>Gérez vos certifications environnementales et qualité : HVE, Agriculture Biologique, GlobalG.A.P. et tout autre référentiel personnalisé.</p>
<h3>Types de certifications</h3>
<ul>
<li><strong>HVE (Haute Valeur Environnementale)</strong> — Niveaux 3 et 4. Checklist intégrée des critères réglementaires (IFT, biodiversité, fertilisation raisonnée).</li>
<li><strong>Agriculture Biologique (AB)</strong> — Critères de conformité cahier des charges (intrants, traçabilité, organisme certificateur, période de conversion).</li>
<li><strong>GlobalG.A.P.</strong> — Référentiel international : traçabilité, hygiène, phytosanitaire, audit interne.</li>
<li><strong>Autre</strong> — Label personnalisé (IGP, Label Rouge, démarche locale…).</li>
</ul>
<h3>Alertes d'échéance</h3>
<p>Les certifications actives expirant dans les 90 jours et celles déjà expirées apparaissent en alerte sur votre tableau de bord arboriculteur.</p>
<h3>Checklist de conformité</h3>
<p>Chaque certification affiche une barre de progression basée sur les critères cochés. Elle est indicative et ne remplace pas l'audit officiel.</p>
<div class="info-box">Le numéro de certificat (ex : FR-BIO-15-XXXXX) est stocké pour référence et traçabilité.</div>`},
    en:{title:'🏅 Certifications',anchor:'certifications',body:`<p>Manage your environmental and quality certifications: HVE, Organic (AB), GlobalG.A.P. or any custom label. Built-in checklists for HVE, AB and GlobalG.A.P. criteria with compliance progress bar. Expiry alerts appear 90 days before deadline and on the orchardist dashboard. Certification number stored for traceability.</p>`}
  },
  yieldmapping:{
    fr:{title:'🍊 Prévision de récolte',anchor:'yieldmapping',body:`
<p>Suivez la prévision de récolte par parcelle et comparez rendement prévu vs réel pour chaque bloc de votre exploitation.</p>
<h3>Parcelles</h3>
<p>Chaque parcelle est définie par : nom, espèce principale, surface (ha), localisation, rendement prévu (kg), récolté réel (kg), période de récolte.</p>
<h3>Indicateurs</h3>
<ul>
<li><strong>% réalisé</strong> — ratio récolté/prévu par parcelle, coloré vert/orange/rouge.</li>
<li><strong>Totaux</strong> — surface totale, tonnage prévu et récolté pour l'ensemble de l'exploitation.</li>
</ul>
<h3>Workflow</h3>
<p>En début de campagne : saisir les prévisions par parcelle. En cours ou après récolte : renseigner le tonnage réel. Le tableau de bord affiche le bilan consolidé.</p>
<div class="info-box">Le tonnage réel peut être saisi progressivement au fur et à mesure de la récolte. Les parcelles sans récolte réelle affichent uniquement la prévision.</div>`},
    en:{title:'🍊 Yield Mapping',anchor:'yieldmapping',body:`<p>Track harvest forecasts by orchard plot and compare planned vs actual yield. Each plot: name, main species, area (ha), location, forecast (kg), actual harvest (kg), harvest window. A % achieved indicator is shown per plot (green/orange/red). Dashboard shows consolidated totals across all plots.</p>`}
  },
  dashboard_adaptatif:{
    fr:{title:'📊 Tableau de bord adaptatif',anchor:'dashboard',body:`
<p>Le tableau de bord s'adapte automatiquement à votre profil utilisateur.</p>
<h3>🍋 Collectionneur</h3>
<p>Météo & alertes gel, statistiques collection, aperçu Wishlist, alertes arrosage urgentes, alertes base de connaissances (ravageurs, taille), derniers événements consignés.</p>
<h3>🌱 Pépiniériste</h3>
<p>KPIs nursery en temps réel (commandes actives, lots disponibles, semis et greffes en cours), CA du mois, stocks intrants critiques, tâches équipe en retard, alertes culturales.</p>
<h3>🌳 Arboriculteur</h3>
<p>ETP/besoins hydriques, alertes phytosanitaires & culturales priorisées, stocks phyto critiques, certifications actives/expirantes, synthèse récolte, tâches en retard.</p>
<h3>🏛 Conservatoire</h3>
<p>Compteurs collection vivante (accessions, échanges actifs, taxons distincts, taxons menacés IUCN), alerte sujets sans numéro d'accession, échanges actifs, accessions récentes, accès export BGCI et étiquettes muséales.</p>`},
    en:{title:'📊 Adaptive Dashboard',anchor:'dashboard',body:`<p>Dashboard adapts to your profile: Collector (watering alerts, wishlist, KB alerts), Nursery grower (KPIs, monthly revenue, stock alerts), Orchardist (ETP, certifications, harvest summary, phyto alerts), Conservatory (accessions, exchanges, IUCN alerts, BGCI export).</p>`}
  },
  certifications:{
    fr:{title:'🏅 Certifications',anchor:'certifications',body:`
<p>Gérez vos certifications environnementales et qualité : HVE, Agriculture Biologique, GlobalG.A.P. ou tout autre référentiel personnalisé.</p>
<h3>Types pris en charge</h3>
<ul>
<li><strong>HVE</strong> — Haute Valeur Environnementale niveaux 3 et 4 : checklist de 10 critères réglementaires (IFT, biodiversité, fertilisation raisonnée, part bio SAU).</li>
<li><strong>AB</strong> — Agriculture Biologique : 8 critères de conformité (intrants, OGM, traçabilité, visite certificateur, période de conversion).</li>
<li><strong>GlobalG.A.P.</strong> — 9 critères : traçabilité, hygiène, phytosanitaire, audit interne, gestion des déchets.</li>
<li><strong>Autre</strong> — label personnalisé (IGP, Label Rouge, démarche locale).</li>
</ul>
<h3>Alertes d'échéance</h3>
<p>Les certifications expirant dans les <strong>90 jours</strong> et celles déjà expirées apparaissent en alerte sur votre tableau de bord arboriculteur.</p>
<h3>Checklist de conformité</h3>
<p>Cochez les critères au fil du temps — une barre de progression indique le taux de conformité. Cette checklist est indicative et ne remplace pas l'audit officiel.</p>
<div class="info-box">Stockez le numéro de certificat (ex : FR-BIO-15-XXXXX) pour référence et traçabilité.</div>`},
    en:{title:'🏅 Certifications',anchor:'certifications',body:`<p>Manage HVE, Organic (AB), GlobalG.A.P. or custom certifications. Built-in checklists with compliance progress bar. Expiry alerts 90 days before deadline and on the orchardist dashboard.</p>`}
  },
  yieldmapping:{
    fr:{title:'🍊 Prévision de récolte',anchor:'yieldmapping',body:`
<p>Suivez la prévision de récolte par <strong>parcelle</strong> et comparez rendement prévu vs réel pour chaque bloc de votre exploitation.</p>
<h3>Saisir une parcelle</h3>
<p>Nom, espèce principale, surface (ha), localisation, rendement prévu (kg), récolté réel (kg après récolte), période de récolte, prix de vente (€/kg), coût de main-d'œuvre.</p>
<h3>Lien avec les sujets</h3>
<p>Sélectionnez les sujets de votre collection liés à cette parcelle — ils apparaîtront en chips cliquables sur la carte de la parcelle.</p>
<h3>Indicateurs calculés</h3>
<ul>
<li><strong>% réalisé</strong> — ratio récolté/prévu, coloré vert/orange/rouge.</li>
<li><strong>Coût MO/ha</strong> — coût main-d'œuvre rapporté à la surface.</li>
<li><strong>CA estimé</strong> — tonnage × prix/kg.</li>
<li><strong>Marge</strong> — CA − coût MO, colorée vert si positive.</li>
</ul>
<div class="info-box">Le tonnage réel peut être saisi progressivement. Les parcelles sans récolte réelle affichent uniquement la prévision.</div>`},
    en:{title:'🍊 Yield Mapping',anchor:'yieldmapping',body:`<p>Track harvest forecasts by orchard plot: planned vs actual yield, cost/ha, estimated revenue and margin per plot. Link collection subjects to plots for full traceability. Consolidated totals shown in dashboard header.</p>`}
  },
  fournisseurs:{
    fr:{title:'🏭 Fournisseurs',anchor:'fournisseurs',body:`
<p>Référencez vos fournisseurs d'intrants, de porte-greffes, de substrats et de matériel. Conservez un historique complet de vos achats par fournisseur.</p>
<h3>Fiche fournisseur</h3>
<p>Nom, catégorie (porte-greffes, greffons, substrats, intrants phyto, engrais, contenants, autre), contact, e-mail, téléphone, site web, notes libres.</p>
<h3>Historique achats</h3>
<p>Enregistrez chaque achat : date, description, montant HT, numéro de bon de commande. Le total par fournisseur et le total exploitation sont calculés automatiquement.</p>
<div class="info-box">Accès : 🌿 Pro → 🌱 Pépinière → onglet 🏭 Fournisseurs.</div>`},
    en:{title:'🏭 Suppliers',anchor:'fournisseurs',body:`<p>Reference your input, rootstock, substrate and equipment suppliers. Record purchases (date, description, amount, PO number) with full history per supplier. Total spend per supplier and consolidated across the nursery is calculated automatically.</p>`}
  },
  genealogie:{
    fr:{title:'🧬 Généalogie de lot',anchor:'genealogie',body:`
<p>Visualisez la <strong>chaîne de traçabilité complète</strong> de chaque lot de greffe : du porte-greffe initial jusqu'à la commande client livrée.</p>
<h3>Chaîne visualisée</h3>
<ol>
<li>✂️ <strong>Lot de greffe</strong> — porte-greffe, date, quantités greffées et reprises.</li>
<li>🌱 <strong>Catalogue</strong> — entrée catalogue correspondante (correspondance automatique par variété si non liée explicitement).</li>
<li>📦 <strong>Commandes client</strong> — toutes les commandes facturant ce lot catalogue : client, quantité, date de livraison, statut.</li>
</ol>
<h3>Conformité phyto B2B</h3>
<p>Cette vue répond aux exigences de traçabilité des cahiers des charges professionnels (GMS, horticulteurs, collectivités) : porte-greffe identifié → variété certifiée → client final.</p>
<div class="info-box">Accès : 🌿 Pro → 🌱 Pépinière → onglet 🧬 Généalogie.</div>`},
    en:{title:'🧬 Lot Genealogy',anchor:'genealogie',body:`<p>Full traceability chain: graft batch (rootstock × scion) → catalog entry → client orders. Automatically matches scions to catalog entries by variety name. Meets B2B phytosanitary traceability requirements.</p>`}
  },
  gantt:{
    fr:{title:'📅 Planning / Timeline',anchor:'gantt',body:`
<p>Visualisez tous les événements de votre collection sur une <strong>timeline horizontale de 12 mois</strong> (−3 mois / +9 mois autour d'aujourd'hui).</p>
<h3>Lecture</h3>
<ul>
<li>Chaque ligne = un sujet de la collection.</li>
<li>Chaque point coloré = un événement (arrosage, fertilisation, taille, greffe, traitement, récolte…).</li>
<li>Les barres horizontales représentent les <strong>périodes de récolte</strong> définies dans le module Récolte.</li>
<li>La barre orange verticale = <strong>aujourd'hui</strong>.</li>
</ul>
<h3>Navigation</h3>
<p>Cliquez sur le nom d'un sujet pour ouvrir directement sa fiche. Les en-têtes de mois permettent de se repérer rapidement. Scroll horizontal sur mobile.</p>
<div class="info-box">Accès : 🌿 Pro → onglet 📅 Planning (arboriculteur et pépiniériste).</div>`},
    en:{title:'📅 Planning / Timeline',anchor:'gantt',body:`<p>12-month horizontal timeline (−3/+9 months) showing all collection events per plant as colored dots by event type. Harvest period bars sourced from Yield Mapping. Orange vertical bar = today. Click plant name to open its record.</p>`}
  },
  wishlist:{
    fr:{title:'🌱 Wishlist — Acquisitions souhaitées',anchor:'wishlist',body:`
<p>La Wishlist permet de suivre les espèces et cultivars que vous souhaitez acquérir pour votre collection.</p>
<h3>Priorité</h3>
<ul><li>🔴 <strong>Haute</strong> — recherche active</li>
<li>🟡 <strong>Moyenne</strong> — opportuniste</li>
<li>🟢 <strong>Basse</strong> — si occasion se présente</li></ul>
<h3>Statuts</h3>
<ul><li><strong>Souhaité</strong> — désir initial</li>
<li><strong>En recherche</strong> — démarche active auprès de fournisseurs</li>
<li><strong>Trouvé</strong> — source identifiée, acquisition en cours</li>
<li><strong>Acquis</strong> — plante intégrée à la collection (archivé)</li></ul>
<div class="info-box">Les souhaits haute priorité apparaissent dans un widget dédié sur votre tableau de bord. Cliquez ✓ pour marquer comme acquis.</div>`},
    en:{title:'🌱 Wishlist',anchor:'wishlist',body:`<p>Track desired species and cultivars with priority (high/medium/low), source, max budget, and status (wanted → searching → found → acquired). High-priority items appear as a dashboard widget.</p>`}
  },
  conservatoire:{
    fr:{title:'🏛 Espace Conservatoire',anchor:'conservatoire',body:`
<p>Outils de gestion de collection vivante institutionnelle : registre des accessions, provenance, échanges inter-institutions, vue taxonomique, export BGCI et étiquettes muséales PDF.</p>
<h3>Accessions</h3>
<p>Numéro au format YYYY-NNNN (généré automatiquement), statut IUCN, statut de conservation (vivant, perdu, en dépôt, prêté), provenance géographique et institution donatrice.</p>
<h3>Échanges inter-institutions</h3>
<p>Enregistrez les prêts, dépôts, échanges et cessions avec les institutions partenaires : type, partenaire, date de retour prévue, statut actif/archivé.</p>
<h3>Vue taxonomique</h3>
<p>Arbre collapsible Famille → Genre → Espèce → Cultivar sur toute la collection.</p>
<h3>Export BGCI</h3>
<p>CSV compatible BGCI PlantSearch : accession, taxon, provenance, statut IUCN.</p>
<h3>Étiquettes muséales PDF</h3>
<p>Générez des étiquettes imprimables pour chaque accession : numéro, binomial, famille, origine.</p>`},
    en:{title:'🏛 Conservatory Space',anchor:'conservatoire',body:`<p>Living collection tools: accession register (YYYY-NNNN), IUCN & conservation status, provenance, inter-institution exchange log, taxonomic tree view, BGCI PlantSearch CSV export, museum label PDF.</p>`}
  },
  eco_tendances:{
    fr:{title:'📈 Tendances économiques',anchor:'eco',body:`
<p>Analyse pluriannuelle de la rentabilité de la collection ou de l'exploitation.</p>
<h3>P&L multi-saisons</h3>
<p>Graphique en barres horizontales (charges en rouge, revenus en vert) par saison. Tableau récapitulatif avec total et marge par arbre.</p>
<h3>Empreinte carbone</h3>
<p>Estimation simplifiée basée sur les facteurs d'émission ADEME par catégorie de dépense. Export CSV disponible.</p>`},
    en:{title:'📈 Economic Trends',anchor:'eco',body:`<p>Multi-year P&L: horizontal bar chart (costs red / revenues green per season), summary table with per-tree margin. Carbon footprint using ADEME emission factors. CSV export.</p>`}
  },
  sync:{
    fr:{title:'☁ Synchronisation',anchor:'sync',body:`
<p>Synchronisez vos données entre plusieurs appareils via un dépôt <strong>GitHub Gist privé</strong> ou un serveur <strong>WebDAV/Nextcloud</strong>.</p>
<h3>Architecture à deux tokens</h3>
<ul>
<li><strong>Token Gist</strong> — classic PAT (<code>ghp_…</code>) obligatoire. Les fine-grained PATs sont incompatibles avec l'API Gist.</li>
<li><strong>Token photos</strong> — fine-grained PAT (<code>github_pat_…</code>) pour le dépôt de photos uniquement.</li>
</ul>
<h3>Chiffrement</h3>
<p>Toutes les données sont chiffrées <strong>AES-256-GCM</strong> sur l'appareil (clé dérivée PBKDF2 depuis votre mot de passe) avant tout envoi. Le fournisseur de sync ne peut pas lire vos données.</p>
<h3>Résolution de conflits</h3>
<p>En cas de conflit (modification simultanée sur deux appareils), l'app propose de choisir la version locale ou distante.</p>`},
    en:{title:'☁ Sync',anchor:'sync',body:`<p>Sync across devices via private GitHub Gist or WebDAV/Nextcloud. Two-token architecture: classic PAT (ghp_…) for Gist, fine-grained PAT for photo repo. AES-256-GCM encryption with PBKDF2 key derivation before any upload. Conflict resolution dialog.</p>`}
  },
  eau:{
    fr:{title:"💧 Qualité de l'eau",anchor:'eau',body:`
<p>Suivez les paramètres de qualité de votre eau d'irrigation : pH, conductivité (EC), dureté (TH), calcium, magnésium, chlore, analyses personnalisées.</p>
<h3>Saisie</h3>
<p>Date de mesure, source (robinet, pluie, puits, citerne, osmosée), et autant de paramètres que nécessaire.</p>
<h3>Historique</h3>
<p>Tableau chronologique de toutes les analyses avec couleur d'alerte si pH ou EC hors plage optimale pour les agrumes (pH 5,5–6,5 ; EC &lt; 1,5 mS/cm).</p>`},
    en:{title:'💧 Water Quality',anchor:'eau',body:`<p>Track irrigation water parameters: pH, EC, hardness, calcium, magnesium, chlorine, custom parameters. Alert coloring for out-of-range pH (5.5–6.5) or EC (>1.5 mS/cm).</p>`}
  },
  epandage:{
    fr:{title:"🪣 Cahier d'épandage",anchor:'epandage',body:`
<p>Le <strong>cahier d'épandage</strong> est un registre obligatoire pour tout épandage de matières organiques (compost, fumier, digestat, lisier, boues STEP).</p>
<p>Il doit être conservé <strong>5 ans</strong> et présenté en cas de contrôle (DDPP, agence de l'eau, organisme certificateur AB/HVE).</p>
<ul>
<li><strong>Date, nature et dose</strong> : obligatoires</li>
<li><strong>ZNT</strong> : distance minimale de 5 m des cours d'eau permanents</li>
<li><strong>Surface</strong> : en hectares, pour calcul de la dose/ha</li>
</ul>
<div class="info-box">Exportez en PDF pour archivage réglementaire ou présentation au contrôleur.</div>`},
    en:{title:'🪣 Organic Spreading Register',anchor:'epandage',body:'<p>Mandatory register for all organic matter applications (compost, manure, digestate, sludge). Must be kept 5 years. Records date, material type, dose, plot, and distance to watercourses (ZNT min. 5m). Export to PDF for regulatory archiving.</p>'}
  },
  ppf:{
    fr:{title:'📋 Plan Prévisionnel de Fumure (PPF)',anchor:'ppf',body:`
<p>Le <strong>PPF</strong> est un document réglementaire obligatoire dans le cadre des certifications HVE niveau 4, Agriculture Biologique et GlobalG.A.P.</p>
<p>Il recense pour chaque sujet les <strong>besoins en N, P, K</strong> (références INRAE/CTIFL) et les <strong>apports réels</strong> du journal cultural sur 12 mois glissants.</p>
<ul>
<li><strong>Solde positif</strong> : apports supérieurs aux besoins — risque de lessivage</li>
<li><strong>Solde négatif</strong> : déficit — risque de carence</li>
<li>Renseignez la <strong>surface (ha)</strong> pour un PPF certifiable</li>
</ul>
<div class="info-box">Ce PPF doit être validé par un conseiller agréé pour toute certification.</div>`},
    en:{title:'📋 Pre-Season Fertilisation Plan',anchor:'ppf',body:`<p>Shows N/P/K needs (INRAE/CTIFL) vs actual 12-month inputs. Enter surface (ha) for certification. Required for HVE level 4, Organic, GlobalG.A.P. Must be co-signed by an approved advisor.</p>`}
  },
  ift:{

    fr:{title:'🌿 Indicateur de Fréquence de Traitement (IFT)',anchor:'ift',body:`
<p>L'IFT mesure l'intensité d'utilisation des produits phytosanitaires par rapport à une dose de référence homologuée.</p>
<h3>Calcul</h3>
<p>IFT = Σ (dose appliquée / dose homologuée) par intervention. Les traitements biologiques (Bacillus, soufre, cuivre à dose réduite) sont comptés séparément.</p>
<h3>Seuils</h3>
<p>L'IFT calculé est comparé à la référence régionale. Un IFT herbicides ≤ 30 % de la référence et un IFT hors herbicides ≤ 50 % sont requis pour la certification HVE niveau 4.</p>`},
    en:{title:'🌿 Treatment Frequency Indicator (IFT)',anchor:'ift',body:`<p>IFT measures pesticide use intensity vs. approved reference dose. IFT = Σ(applied dose / approved dose) per intervention. Biological treatments tracked separately. HVE level 4 requires IFT ≤30% (herbicides) and ≤50% (others) of regional reference.</p>`}
  },
  gjc:{
    fr:{title:'🌡 Degrés-Jours & Heures de froid',anchor:'gjc',body:`
<p>Deux indicateurs phénologiques calculés automatiquement à partir des données météo chargées.</p>
<h3>Degrés-Jours de Croissance (DJC)</h3>
<p>Σ max(0, T_moy − T_base) depuis le 1er janvier. T_base = 10 °C pour les agrumes. Indicateur de l'avancement de la saison végétative.</p>
<h3>Heures de froid</h3>
<p>Σ heures avec T ≤ 7,2 °C depuis le 1er novembre. Requis pour la levée de dormance de certains porte-greffes (Poncirus, mandariniers).</p>`},
    en:{title:'🌡 Growing Degree Days & Chilling Hours',anchor:'gjc',body:`<p>GDD = Σ max(0, T_avg − 10°C) since Jan 1. Chilling hours = Σ hours with T ≤ 7.2°C since Nov 1. Both calculated from loaded weather data and displayed in the Fertilisation / Climate section.</p>`}
  },
  pepiniere_dashboard:{
    fr:{title:'🌱 Dashboard Pépinière',anchor:'pepiniere',body:`
<p>Vue d'ensemble en temps réel de la production : plants disponibles à la vente, en cours d'élevage, taux de reprise moyen, CA total, commandes en attente.</p>
<h3>Alertes automatiques</h3>
<ul>
<li>Lots disponibles dans les 30 prochains jours.</li>
<li>Commandes en retard (date livraison dépassée).</li>
<li>Stocks d'intrants en alerte (sous le seuil configuré).</li>
</ul>`},
    en:{title:'🌱 Nursery Dashboard',anchor:'pepiniere',body:`<p>Real-time nursery KPIs: plants available for sale, in production, average graft take rate, total revenue, pending orders. Automatic alerts for lots available within 30 days, overdue orders, and low input stocks.</p>`}
  },
  pepiniere_planning:{
    fr:{title:'📅 Planning pépinière',anchor:'pepiniere',body:`
<p>Calendrier de production pépinière : semis, greffes et disponibilités sur une vue mensuelle.</p>
<h3>Événements affichés</h3>
<ul>
<li>Dates de semis planifiées.</li>
<li>Dates de greffe.</li>
<li>Dates de disponibilité des lots.</li>
<li>Dates de livraison des commandes.</li>
</ul>`},
    en:{title:'📅 Nursery Planning',anchor:'pepiniere',body:`<p>Monthly calendar view of nursery production: sowing dates, graft dates, lot availability dates, and order delivery dates.</p>`}
  },
  pepiniere_rentabilite:{
    fr:{title:'📈 Rentabilité pépinière',anchor:'pepiniere',body:`
<p>Analyse de la rentabilité de la pépinière : CA par variété, marge par lot, coût de production estimé, évolution mensuelle du chiffre d'affaires.</p>
<h3>Indicateurs</h3>
<ul>
<li><strong>CA total</strong> — commandes soldées × prix unitaire.</li>
<li><strong>Marge par lot</strong> — CA lot − coûts de production saisis.</li>
<li><strong>CA mensuel</strong> — courbe d'évolution sur 12 mois.</li>
</ul>`},
    en:{title:'📈 Nursery Profitability',anchor:'pepiniere',body:`<p>Nursery profitability: revenue by variety, margin per batch, production cost tracking, monthly revenue trend over 12 months.</p>`}
  },
  pepiniere_clients:{
    fr:{title:'👤 CRM Clients pépinière',anchor:'pepiniere',body:`
<p>Gérez votre portefeuille clients : coordonnées, historique des commandes, chiffre d'affaires par client, notes de relation commerciale.</p>
<h3>Fonctions</h3>
<ul>
<li>Fiche client complète (nom, société, contact, e-mail, téléphone, adresse).</li>
<li>Historique automatique des commandes liées.</li>
<li>CA total par client calculé sur toutes les commandes soldées.</li>
</ul>`},
    en:{title:'👤 Nursery CRM',anchor:'pepiniere',body:`<p>Client portfolio management: contact details, order history, revenue per client, commercial notes. CA per client calculated automatically from completed orders.</p>`}
  },
  wiki:{
    fr:{title:'📖 Citrus Wiki',anchor:'wiki',body:`
<p>Le <strong>Citrus Wiki</strong> est une base de connaissances collaborative intégrée à l'application, accessible hors ligne. Il couvre la botanique, la culture, les maladies et les techniques horticoles des agrumes.</p>
<h3>Navigation</h3>
<p>Menu → <strong>📖 Communauté</strong> → onglet Wiki. Les articles sont classés par catégories (Botanique, Culture, Maladies, Variétés…). Utilisez la barre de recherche pour retrouver un article par mot-clé.</p>
<h3>Lire un article</h3>
<p>Cliquez sur un titre pour ouvrir l'article. Chaque article affiche son contenu formaté, les backlinks vers d'autres articles et les notes de bas de page numérotées.</p>
<h3>Créer ou modifier un article</h3>
<ol style="padding-left:18px;font-size:.9rem;line-height:1.8">
<li>Ouvrez l'article → bouton <strong>✏️ Modifier</strong>.</li>
<li>Rédigez en <strong>Markdown</strong> : gras (<code>**texte**</code>), italique (<code>*texte*</code>), listes, titres, liens internes <code>[[Titre article]]</code>.</li>
<li>Cliquez <strong>💾 Enregistrer</strong> — vos modifications sont versionnées.</li>
</ol>
<h3>Historique des révisions</h3>
<p>Bouton 🕐 sur chaque article → liste des versions avec dates. Vous pouvez consulter n'importe quelle version antérieure.</p>
<div class="info-box">Le wiki est <strong>offline-first</strong> : les articles consultés une fois restent accessibles sans connexion. Le contenu est synchronisé avec le serveur quand vous êtes en ligne.</div>`},
    en:{title:'📖 Citrus Wiki',anchor:'wiki',body:`<p>Integrated offline-first knowledge base covering citrus botany, culture, diseases and techniques. Navigate via Menu → 📖 Community → Wiki tab. Articles organised by category with full-text search. Edit in Markdown (bold, italic, lists, <code>[[internal links]]</code>). All edits are versioned — view history via the 🕐 button.</p>`}
  },
  observatoire:{
    fr:{title:'🗺 Observatoire CitrusCodex',anchor:'observatoire',body:`
<p>L'<strong>Observatoire CitrusCodex</strong> cartographie les événements culturaux et phytosanitaires signalés par les membres de la communauté sur toute la France et les régions méditerranéennes.</p>
<h3>Carte</h3>
<p>Chaque point coloré représente un événement partagé. Couleurs : 🌸 floraison (rose), 🍊 récolte (orange), ❄️ gel (bleu), 🦠 maladie (rouge), 🐛 ravageur (violet), 📌 autre (gris).</p>
<h3>Statistiques</h3>
<p>Vue par saison et par année : compteurs d'observations, espèces et régions les plus actives, pic de floraison, GJC moyen national.</p>
<h3>Journal</h3>
<p>Chronologie des 10 dernières observations partagées, avec espèce et région d'origine.</p>
<h3>Contribuer</h3>
<p>Activez votre participation dans <strong>⚙ Réglages → Observatoire communautaire</strong> en renseignant votre commune. Vos coordonnées sont approximées à la commune (~2 km) — jamais partagées à la parcelle près.</p>
<div class="info-box">La participation est <strong>opt-in</strong> et peut être désactivée à tout moment. Seuls les membres ayant activé leur participation peuvent contribuer.</div>`},
    en:{title:'🗺 CitrusCodex Observatory',anchor:'observatoire',body:`<p>Community map of cultural and phytosanitary events across France and the Mediterranean. Each colour-coded point = a shared event (flowering, harvest, frost, disease, pest). Stats by season and year. Opt-in participation: enable in Settings → Community Observatory, enter your town. Coordinates approximated to town level (~2 km precision).</p>`}
  },
  phyto:{
    fr:{title:'🧪 Registre phytosanitaire',anchor:'phyto',body:`
<p>Le <strong>registre phytosanitaire</strong> trace tous vos traitements. Il est obligatoire pour les professionnels et recommandé pour tous.</p>
<h3>Champs réglementaires</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>Produit</td><td>Nom commercial + numéro AMM</td></tr>
<tr><td>Culture / cible</td><td>Espèce traitée et usage</td></tr>
<tr><td>Date</td><td>Date d'application</td></tr>
<tr><td>Dose (L/ha)</td><td>Dose appliquée</td></tr>
<tr><td>Surface (ha)</td><td>Surface traitée</td></tr>
<tr><td>DAR</td><td>Délai Avant Récolte (jours)</td></tr>
<tr><td>Opérateur</td><td>Personne ayant effectué le traitement</td></tr>
</table>
<h3>Calculs automatiques</h3>
<p>Date de récolte au plus tôt (application + DAR) et IFT calculés automatiquement dès que dose et surface sont renseignés.</p>
<div class="warn-box">Conservation <strong>5 ans</strong> obligatoire pour les professionnels. Exportez en PDF via le bouton d'impression sur chaque traitement.</div>`},
    en:{title:'🧪 Phytosanitary Register',anchor:'phyto',body:`<p>Log all phytosanitary treatments: product name + AMM number, culture/target, date, dose (L/ha), surface (ha), DAR (days to harvest), operator. Earliest harvest date (date + DAR) and TFI automatically calculated. Mandatory for professional growers — keep records for 5 years.</p>`}
  },
  profil:{
    fr:{title:'👤 Profil utilisateur',anchor:'profil',body:`
<p>Votre profil détermine l'interface et les fonctionnalités disponibles dans l'application.</p>
<h3>4 profils disponibles</h3>
<table>
<tr><th>Profil</th><th>Fonctionnalités supplémentaires</th></tr>
<tr><td>🍋 Collectionneur</td><td>Collection, événements, calendrier, météo, wiki, wishlist</td></tr>
<tr><td>🌱 Pépiniériste</td><td>+ Pépinière, semis, catalogue, commandes, clients, stages, planning</td></tr>
<tr><td>🌳 Arboriculteur</td><td>+ Phytosanitaire, IFT, PPF, certifications, yield mapping, équipe</td></tr>
<tr><td>🏛 Conservatoire</td><td>+ Accessions, échanges inter-institutions, export BGCI, étiquettes muséales</td></tr>
</table>
<p>Le profil est défini lors de la création du compte. Le tableau de bord, les alertes et les onglets Espace Pro s'adaptent automatiquement.</p>
<div class="info-box">Contactez l'équipe CitrusCodex si vous souhaitez changer de profil.</div>`},
    en:{title:'👤 User Profile',anchor:'profil',body:`<p>Your profile determines available features. Collector: collection, events, weather, wiki, wishlist. Nursery grower (+nursery, orders, clients, stages, planning). Orchardist (+phyto, IFT, PPF, certifications, yield mapping, team). Conservatory (+accessions, exchanges, BGCI export, museum labels). Dashboard, alerts, and Pro Space tabs adapt automatically to your profile.</p>`}
  },
  phenologie:{
    fr:{title:'🌸 Phénologie BBCH',anchor:'phenologie',body:`
<p>Le module phénologie suit les stades de développement de vos agrumes selon l'<strong>échelle BBCH</strong> (Biologische Bundesanstalt, Bundessortenamt und CHemische Industrie — référence <em>Agustí et al. 1997</em>).</p>
<h3>8 stades principaux</h3>
<table>
<tr><th>Stade</th><th>Codes</th><th>Description</th></tr>
<tr><td>🌑 Dormance</td><td>00–09</td><td>Bourgeon dormant, repos végétatif</td></tr>
<tr><td>🟢 Gonflement</td><td>10–19</td><td>Débourrement, gonflement bourgeon</td></tr>
<tr><td>🌱 Feuillaison</td><td>20–29</td><td>Développement feuilles</td></tr>
<tr><td>🌿 Pousse</td><td>30–39</td><td>Allongement des tiges</td></tr>
<tr><td>🌸 Floraison</td><td>60–69</td><td>De bouton fermé à fleur ouverte</td></tr>
<tr><td>🍈 Nouaison</td><td>70–79</td><td>Formation et chute physiologique</td></tr>
<tr><td>🍊 Croissance</td><td>80–89</td><td>Développement du fruit</td></tr>
<tr><td>🟠 Maturité</td><td>90–99</td><td>Véraison à maturité complète</td></tr>
</table>
<h3>Accès</h3>
<p>Dashboard → widget phénologie (sous la météo) · Fiche plante → onglet 🌸 Phénologie</p>`},
    en:{title:'🌸 BBCH Phenology',anchor:'phenologie',body:`<p>Tracks citrus development stages using the BBCH scale (Agustí et al. 1997). 8 main stages, 33 sub-codes: dormancy (00), budding (10), leaf development (20), shoot elongation (30), flowering (60), fruit set (70), fruit growth (80), maturity (90). Available on the dashboard widget (below weather) and plant record → 🌸 Phenology tab.</p>`}
  },
  gel:{
    fr:{title:'❄️ Risque de gel',anchor:'gel',body:`
<p>L'application surveille les températures minimales prévues et compare au seuil de rusticité de chaque espèce.</p>
<h3>Seuils indicatifs</h3>
<table>
<tr><th>Espèce</th><th>Seuil critique</th></tr>
<tr><td>Citron, Lime</td><td>−2°C</td></tr>
<tr><td>Clémentine, Mandarine</td><td>−4°C</td></tr>
<tr><td>Oranger, Pomelo</td><td>−5°C</td></tr>
<tr><td>Kumquat</td><td>−10°C</td></tr>
<tr><td>Poncirus trifoliata</td><td>−20°C</td></tr>
</table>
<h3>Alertes</h3>
<p>Bandeau rouge = risque de gel aujourd'hui · Bandeau bleu = risque demain. La section <strong>❄ Sujets à rentrer</strong> du tableau de bord liste les plantes en extérieur sous leur seuil de rusticité.</p>
<h3>Enregistrer un dégât</h3>
<p>Type d'événement <strong>❄️ Gel</strong> sur la fiche sujet → renseignez T° minimale atteinte, organes touchés, sévérité.</p>`},
    en:{title:'❄️ Frost Risk',anchor:'gel',body:`<p>App monitors forecast minimum temperatures vs each species' hardiness threshold. Red banner = frost risk today, blue = risk tomorrow. "Plants to bring in" dashboard section lists outdoor subjects at risk. Record frost damage via the ❄️ Frost event type: min temperature reached, affected organs, severity.</p>`}
  },
  irrigation:{
    fr:{title:'💧 Bilan hydrique (ETP/ETc)',anchor:'irrigation',body:`
<p>Le bilan hydrique calcule le <strong>déficit hydrique</strong> cumulé de votre collection en comparant les besoins culturaux (ETc) aux précipitations effectives.</p>
<h3>Calcul ETc</h3>
<div class="formula">ETc = ETP × Kc</div>
<p>Kc (coefficient cultural agrumes) : 0,65 en dormance → 0,85 en végétation active → 1,05 en floraison.</p>
<h3>Bilan</h3>
<p>Déficit = Σ(ETc − pluie efficace) sur la période sélectionnée. La réserve utile du sol (RU) détermine le nombre de jours tolérables sans irrigation.</p>
<h3>Recommandation</h3>
<p>L'interface affiche la durée d'arrosage recommandée en fonction du débit de votre système (L/h configurable).</p>`},
    en:{title:'💧 Water Balance (ETP/ETc)',anchor:'irrigation',body:`<p>Cumulative water deficit from ETc (= ETP × Kc) minus effective rainfall. Citrus Kc: 0.65 dormant → 0.85 growing → 1.05 flowering. Soil Useful Reserve determines tolerable days without irrigation. Displays recommended watering duration based on your system flow rate (L/h configurable).</p>`}
  },
  etp:{
    fr:{title:'🌡 ETP — Évapotranspiration',anchor:'etp',body:`
<p>L'<strong>Évapotranspiration Potentielle</strong> (ETP) quantifie l'eau perdue par le sol et les plantes sous les conditions climatiques locales. C'est la base de tout calcul d'irrigation raisonnée.</p>
<h3>Formule Penman-Monteith (FAO-56)</h3>
<div class="formula">ETP = [0,408·Δ·(Rn−G) + γ·(900/(T+273))·u₂·(es−ea)] / [Δ + γ·(1+0,34·u₂)]</div>
<p>Rn = rayonnement net · T = température (°C) · u₂ = vent à 2m · es−ea = déficit de pression vapeur · Δ = pente courbe vapeur · γ = constante psychrométrique.</p>
<h3>Fallback Hargreaves-Samani</h3>
<div class="formula">ETP = 0,0023 · Ra · (Tmoy+17,8) · (Tmax−Tmin)^0,5</div>
<p>Utilisé si certains paramètres météo sont manquants. Moins précis mais robuste.</p>
<h3>Source des données</h3>
<p>Paramètres lus depuis Open-Meteo (<code>temperature_2m, windspeed_10m, relativehumidity_2m, shortwave_radiation</code>) à vos coordonnées GPS.</p>`},
    en:{title:'🌡 ETP — Evapotranspiration',anchor:'etp',body:`<p>Potential Evapotranspiration quantifies water loss from soil and plants. Penman-Monteith (FAO-56) used when all parameters available; Hargreaves-Samani as fallback (Tmin/Tmax only). Data from Open-Meteo API at your GPS location. Used to calculate ETc needs and irrigation recommendations.</p>`}
  },
  drip:{
    fr:{title:'💧 Goutte-à-Goutte',anchor:'drip',body:`
<p>Le module goutte-à-goutte modélise vos circuits d'irrigation partagés et calcule la durée d'arrosage optimale par zone.</p>
<h3>Configurer un circuit</h3>
<ol style="padding-left:18px;font-size:.9rem;line-height:1.8">
<li>🌿 Pro → 💧 Eau → onglet <strong>Circuits</strong> → ＋ Nouveau circuit</li>
<li>Renseignez : débit pompe (L/h), nombre et débit de goutteurs, sujets reliés</li>
<li>L'app calcule la durée couvrant les besoins ETc de tous les sujets du circuit</li>
</ol>
<h3>Détection de sur-arrosage</h3>
<p>Si la durée calculée dépasse la capacité de drainage du substrat, un avertissement s'affiche avec suggestion de fractionnement.</p>
<div class="info-box">Compatible avec les programmateurs temporisés : entrez le débit horaire de votre programmateur pour obtenir une durée directement réglable.</div>`},
    en:{title:'💧 Drip Irrigation',anchor:'drip',body:`<p>Models shared drip circuits and calculates optimal watering duration per zone. Configure: pump flow (L/h), dripper count and flow rate, linked subjects. Calculated duration covers ETc needs of all circuit subjects. Over-watering detection suggests split schedule if drainage capacity exceeded.</p>`}
  },
  filtres:{
    fr:{title:'🔍 Filtres de collection',anchor:'filtres',body:`
<p>Filtrez votre collection par plusieurs critères simultanés pour retrouver rapidement un sujet.</p>
<h3>Filtres disponibles</h3>
<table>
<tr><th>Critère</th><th>Valeurs</th></tr>
<tr><td>Mode de culture</td><td>Pot / Pleine terre</td></tr>
<tr><td>Statut sanitaire</td><td>Sain / Vigilance / Traitement / Quarantaine</td></tr>
<tr><td>Emplacement</td><td>Intérieur / Extérieur / Orangerie / Serre</td></tr>
<tr><td>Arrosage</td><td>Urgent / Bientôt / OK</td></tr>
</table>
<h3>Recherche textuelle</h3>
<p>La barre filtre en temps réel sur : nom, espèce, variété, porte-greffe, notes.</p>
<div class="info-box">Un badge compteur indique le nombre de filtres actifs. Appuyez sur <strong>✕ Réinitialiser</strong> pour les effacer tous.</div>`},
    en:{title:'🔍 Collection Filters',anchor:'filtres',body:`<p>Filter your collection by multiple simultaneous criteria: growing mode (pot/ground), health status, location (indoor/outdoor/greenhouse), watering urgency. Text search filters in real time on name, species, variety, rootstock, notes. Active filters show a badge counter. Press ✕ Reset to clear all.</p>`}
  },
  boutures:{
    fr:{title:'🌿 Boutures',anchor:'boutures',body:`
<p>Suivez vos boutures depuis le prélèvement jusqu'au repiquage via le type d'événement <strong>✂️ Bouture</strong>.</p>
<h3>Champs disponibles</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>Méthode</td><td>Herbacée · Semi-lignifiée · Lignifiée · Marcottage</td></tr>
<tr><td>Substrat</td><td>Terreau boutures · Sable · Perlite · Mélange personnalisé</td></tr>
<tr><td>Hormone</td><td>ANA, AIB, IBA ou sans</td></tr>
<tr><td>Quantité</td><td>Nombre de boutures réalisées</td></tr>
<tr><td>Date de contrôle</td><td>Date prévue de vérification de la reprise</td></tr>
</table>
<h3>Taux de reprise</h3>
<p>Renseignez le taux observé lors d'un suivi. Les boutures avec reprise &gt; 0 peuvent être transférées vers le catalogue pépinière.</p>
<div class="info-box">Le lien entre la bouture et le sujet source est conservé pour la traçabilité génétique dans l'espace Conservatoire.</div>`},
    en:{title:'🌿 Cuttings',anchor:'boutures',body:`<p>Track cuttings via the ✂️ Cutting event type. Fields: method (herbaceous/semi-ligneous/ligneous/layering), substrate, hormone (IBA/ANA/none), quantity, planned check date. Record take rate on follow-up. Cuttings with take > 0 can be pushed to nursery catalog. Source subject link maintained for genetic traceability.</p>`}
  },
  stocks:{
    fr:{title:'📦 Stocks d\'intrants',anchor:'stocks',body:`
<p>Gérez vos stocks d'intrants agricoles : engrais, produits phytosanitaires, substrats, amendements.</p>
<h3>Fonctions</h3>
<ul>
<li><strong>Ajout de lot</strong> : produit, fournisseur, quantité, unité, date d'achat, coût unitaire</li>
<li><strong>Consommation automatique</strong> : décrémentée à chaque traitement ou fertilisation si le produit est lié</li>
<li><strong>Seuil d'alerte</strong> : configurable par produit — alerte sur le tableau de bord si stock sous le seuil</li>
</ul>
<h3>Intégration</h3>
<p>Les produits en stock apparaissent dans le sélecteur d'engrais et de traitements. Après un épandage, la quantité utilisée est proposée pour déduction.</p>
<div class="info-box">Accès : 🌿 Pro → onglet 📦 Stocks.</div>`},
    en:{title:'📦 Input Stocks',anchor:'stocks',body:`<p>Manage agricultural input stocks (fertilisers, phyto products, substrates, amendments). Functions: batch entry (product, supplier, qty, unit, date, cost), auto-deduction from treatment/fertilisation events, configurable alert threshold per product with dashboard warning. Stock products appear in event selectors.</p>`}
  },
  bug_report:{
    fr:{title:'🐛 Signaler un problème',anchor:'bug-report',body:`
<p>Le bouton flottant <strong>🐛</strong> (coin inférieur droit) permet de signaler un problème ou une suggestion directement depuis l'application.</p>
<h3>Formulaire</h3>
<table>
<tr><th>Champ</th><th>Description</th></tr>
<tr><td>Titre</td><td>Résumé court du problème (obligatoire)</td></tr>
<tr><td>Description</td><td>Étapes pour reproduire, comportement attendu vs observé</td></tr>
<tr><td>Catégorie</td><td>Bug · Fonctionnalité · Interface · Performance · Autre</td></tr>
<tr><td>Sévérité</td><td>Faible · Moyenne · Haute · Critique</td></tr>
</table>
<h3>Mode hors-ligne</h3>
<p>Si vous êtes hors connexion, le rapport est sauvegardé localement et envoyé automatiquement à la prochaine connexion.</p>
<h3>Déplacer le bouton</h3>
<p>Maintenez le bouton 🐛 enfoncé (1 seconde) et glissez-le pour le repositionner. Sa position est mémorisée.</p>
<h3>Suivi</h3>
<p>⚙ Réglages → <strong>Mes signalements</strong> — statuts : Ouvert / En cours / Résolu / Fermé.</p>`},
    en:{title:'🐛 Report a Problem',anchor:'bug-report',body:`<p>The floating 🐛 button (bottom right) reports issues or suggestions directly from the app. Fields: title, description (steps to reproduce), category (bug/feature/UI/perf), severity (low/medium/high/critical). Reports saved locally when offline and sent on next connection. Long-press to drag and reposition. Track status in Settings → My Reports.</p>`}
  },
  notifications:{
    fr:{title:'🔔 Notifications',anchor:'notifications',body:`
<p>L'application peut envoyer des notifications push pour vous alerter des événements importants.</p>
<h3>Types configurables</h3>
<ul>
<li>❄️ <strong>Alerte gel</strong> — température prévue sous le seuil de rusticité</li>
<li>💧 <strong>Arrosage urgent</strong> — sujets en déficit hydrique critique</li>
<li>📅 <strong>Rappels calendrier</strong> — événements planifiés arrivant à échéance</li>
<li>🌸 <strong>Changement de stade BBCH</strong> — transition phénologique détectée</li>
<li>🐛 <strong>Alerte phytosanitaire</strong> — conditions météo favorables à un ravageur</li>
</ul>
<h3>Activer</h3>
<p>⚙ Réglages → section <strong>Notifications</strong> → Activer → le navigateur demande l'autorisation.</p>
<div class="info-box">Nécessite un navigateur compatible Service Worker (Chrome, Firefox, Edge, Safari 16.4+). Les notifications ne fonctionnent pas en navigation privée.</div>`},
    en:{title:'🔔 Notifications',anchor:'notifications',body:`<p>Push notifications for: frost alerts, urgent watering, calendar reminders, BBCH stage changes, phytosanitary alerts. Enable in Settings → Notifications → Allow browser permission. Requires Service Worker-compatible browser (Chrome/Firefox/Edge/Safari 16.4+). Not available in private browsing.</p>`}
  },
  dark_mode:{
    fr:{title:'🌙 Mode sombre',anchor:'dark-mode',body:`
<p>L'application s'adapte automatiquement au thème de votre système (clair ou sombre).</p>
<h3>Activation manuelle</h3>
<p>⚙ Réglages → section <strong>Apparence</strong>. Trois options :</p>
<ul>
<li><strong>Auto</strong> — suit le thème de l'OS</li>
<li><strong>Clair</strong> — forcé en mode clair</li>
<li><strong>Sombre</strong> — forcé en mode sombre</li>
</ul>
<p>Le mode sombre réduit la fatigue oculaire lors d'une utilisation nocturne et économise la batterie sur les écrans OLED.</p>`},
    en:{title:'🌙 Dark Mode',anchor:'dark-mode',body:`<p>Auto-adapts to system theme. Manual override in Settings → Appearance: Auto (follows OS), Light, or Dark. Dark mode reduces eye strain and saves battery on OLED screens.</p>`}
  },
  historique:{
    fr:{title:'📜 Historique global',anchor:'historique',body:`
<p>L'historique global affiche la chronologie complète de toutes les actions sur l'ensemble de votre collection.</p>
<h3>Contenu</h3>
<p>Tous les événements culturaux (arrosage, fertilisation, taille, traitement…) + modifications de fiche (audit trail automatique), de tous vos sujets, en ordre chronologique inverse.</p>
<h3>Filtrage</h3>
<p>Filtrez par type d'événement, par sujet, ou par période. Cliquez sur un événement pour accéder directement à la fiche du sujet concerné.</p>
<h3>Accès</h3>
<p>⚙ Réglages → <strong>📜 Historique</strong>.</p>`},
    en:{title:'📜 Global History',anchor:'historique',body:`<p>Reverse-chronological timeline of all events across all collection subjects: cultural events and record edits (auto audit trail). Filter by event type, subject, or date range. Click any event to navigate directly to the subject record.</p>`}
  },
  iot:{
    fr:{title:'📡 Capteurs IoT',anchor:'iot',body:`
<p>Connectez vos capteurs IoT pour automatiser la collecte de données climatiques et d'irrigation.</p>
<h3>Protocoles supportés</h3>
<ul>
<li><strong>HTTP/JSON polling</strong> — lecture périodique d'une URL locale</li>
<li><strong>WebSocket</strong> — connexion temps réel pour flux continu</li>
</ul>
<h3>Données lues</h3>
<p>Température ambiante, humidité relative, humidité du substrat, conductivité électrique (EC), luminosité (lux), CO₂ (ppm).</p>
<h3>Alertes</h3>
<p>Configurez des seuils par paramètre — notification push déclenchée si une valeur sort de la plage définie.</p>
<h3>Intégration</h3>
<p>Les données capteur alimentent automatiquement les jauges d'arrosage et le bilan ETP si un capteur T°/humidité est configuré.</p>
<div class="info-box">Accès : ⚙ Réglages → <strong>📡 Capteurs IoT</strong>.</div>`},
    en:{title:'📡 IoT Sensors',anchor:'iot',body:`<p>Connect sensors via HTTP/JSON polling or WebSocket. Reads: ambient temperature, relative humidity, substrate moisture, EC, light (lux), CO₂ (ppm). Configure alert thresholds per parameter (push notification on breach). Sensor T°/humidity data automatically feeds watering gauges and ETP balance.</p>`}
  },
  admin_users:{
    fr:{title:'👥 Administration — Utilisateurs',anchor:'admin',body:`
<p>Accessible aux comptes administrateur uniquement : ⚙ Réglages → <strong>Administration</strong>.</p>
<h3>Fonctions</h3>
<ul>
<li><strong>Liste complète</strong> : email, profil, date de création, dernière connexion, statut</li>
<li><strong>Invitations bêta</strong> : envoyer une invitation à un nouvel utilisateur</li>
<li><strong>Reset mot de passe</strong> : générer un token de réinitialisation</li>
<li><strong>Notes admin</strong> : annotations internes sur un utilisateur</li>
<li><strong>Suspension</strong> : désactiver temporairement l'accès</li>
</ul>
<h3>Statistiques globales</h3>
<p>Total utilisateurs actifs · Connexions 24h/7j · Nombre total de sujets dans la collection globale.</p>`},
    en:{title:'👥 Admin — Users',anchor:'admin',body:`<p>Admin-only (Settings → Administration). Functions: user list (email, profile, created, last login, active/suspended), beta invitations, password reset token generation, admin notes, account suspension. Global stats: active users, recent logins, total collection subjects.</p>`}
  },
  admin_bugs:{
    fr:{title:'🐛 Administration — Signalements',anchor:'admin',body:`
<p>Interface d'administration des signalements de bugs et suggestions. Accessible aux administrateurs uniquement.</p>
<h3>Fonctions</h3>
<ul>
<li><strong>Liste globale</strong> : tous les signalements de tous les utilisateurs</li>
<li><strong>Statuts</strong> : Ouvert → En cours → Résolu → Fermé · Ne sera pas corrigé</li>
<li><strong>Notes de résolution</strong> : commentaire visible par l'utilisateur signalant</li>
<li><strong>Filtres</strong> : par catégorie, sévérité, statut, utilisateur</li>
</ul>`},
    en:{title:'🐛 Admin — Bug Reports',anchor:'admin',body:`<p>Admin-only interface for managing all user reports. Functions: global list, status management (Open → In progress → Resolved → Closed/Won't fix), resolution notes visible to reporter, filters by category, severity, status, user.</p>`}
  },
  season_banner:{
    fr:{title:'🌾 Bannière saisonnière',anchor:'dashboard',body:`
<p>La bannière saisonnière affiche les <strong>tâches prioritaires</strong> du moment en haut du tableau de bord.</p>
<h3>Recommandations par saison</h3>
<table>
<tr><th>Saison</th><th>Tâches types recommandées</th></tr>
<tr><td>🌱 Printemps</td><td>Sortie hivernage · Première fertilisation · Taille de formation</td></tr>
<tr><td>☀️ Été</td><td>Arrosage soutenu · Traitement acariens · Suivi Brix récolte</td></tr>
<tr><td>🍂 Automne</td><td>Récolte tardive · Préparation hivernage · Amendement de fond</td></tr>
<tr><td>❄️ Hiver</td><td>Rentrée hivernage · Taille · Traitement d'hiver (huile blanche)</td></tr>
</table>
<p>La détection de saison est automatique (date + hémisphère). La bannière est dismissible — cliquez ✕ pour la masquer jusqu'au prochain changement de saison.</p>`},
    en:{title:'🌾 Seasonal Banner',anchor:'dashboard',body:`<p>Displays current season priority tasks at the top of the dashboard. Season auto-detected from date and hemisphere. Spring: bring out plants, first fertilisation, training pruning. Summer: irrigation, mite control, Brix monitoring. Autumn: late harvest, winterisation, soil amendment. Winter: bring in tender plants, pruning, dormant spray. Dismissible until next season change.</p>`}
  },
  dashboard:{
    fr:{title:'🏠 Tableau de bord',anchor:'dashboard',body:`
<p>Le tableau de bord est la page d'accueil. Son contenu s'adapte automatiquement à votre profil et à votre collection.</p>
<h3>Widgets communs</h3>
<ul>
<li>🌤 <strong>Météo locale</strong> — 7 jours de prévisions, alerte gel, GJC</li>
<li>💧 <strong>Arrosage urgent</strong> — sujets en déficit, colorés par urgence</li>
<li>📚 <strong>Alertes KB</strong> — ravageurs en période de risque, tailles recommandées</li>
<li>🌾 <strong>Bannière saisonnière</strong> — tâches recommandées selon la saison</li>
<li>📅 <strong>Prochains rappels</strong> — événements planifiés du calendrier</li>
</ul>
<h3>Widgets adaptés au profil</h3>
<p>Pépiniériste : KPIs nursery, CA du mois, lots disponibles. Arboriculteur : ETP, certifications, bilan récolte. Conservatoire : accessions, échanges actifs, taxons menacés IUCN.</p>
<div class="info-box">Le tableau de bord se recharge à chaque accès pour afficher les données météo et arrosage les plus récentes.</div>`},
    en:{title:'🏠 Dashboard',anchor:'dashboard',body:`<p>Home page of the app. Adapts to your profile. Common widgets: local weather (7-day, frost alert, GDD), urgent watering (colour-coded), KB alerts (seasonal pest/pruning warnings), seasonal banner (current period tasks), upcoming calendar reminders. Profile-specific widgets: Nursery KPIs, Orchardist ETP/certifications, Conservatory accessions/IUCN alerts.</p>`}
  }
};




function showHelp(key) {
  const lang  = getLang();
  const ld    = HELP_CONTENT[key];
  if (!ld) return;
  const entry = ld[lang] || ld.fr;
  const panel = document.createElement('div');
  panel.className = 'help-panel';
  panel.id        = 'help-panel';
  panel.innerHTML = `<div class="help-panel-bg" onclick="closeHelp()"></div>
<div class="help-panel-body" role="dialog" aria-label="${entry.title}">
  <div class="help-panel-header">
    <span class="help-panel-title">${entry.title}</span>
    <button class="help-panel-close" onclick="closeHelp()" aria-label="Fermer">✕</button>
  </div>
  <div class="help-panel-content">${entry.body}</div>
  <a href="aide.html#${entry.anchor}" target="_blank" class="help-panel-link">${T('misc.helpGuideLink')}</a>
</div>`;
  document.body.appendChild(panel);
  setTimeout(() => panel.querySelector('.help-panel-close')?.focus(), 60);
}

function closeHelp() { document.getElementById('help-panel')?.remove(); }

function helpBtn(key) {
  return `<button class="help-btn" onclick="event.stopPropagation();showHelp('${key}')" aria-label="Aide ${key}" title="Aide">?</button>`;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeHelp(); window.closeDiag?.(); }
});

window.HELP_CONTENT = HELP_CONTENT;
window.showHelp     = showHelp;
window.closeHelp    = closeHelp;
window.helpBtn      = helpBtn;
