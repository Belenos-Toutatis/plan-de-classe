#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PORT=8765
URL="http://localhost:$PORT/plan de classe.html"

# Démarrer le serveur HTTP en arrière-plan
if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT &>/dev/null &
elif command -v python &>/dev/null; then
  python -m http.server $PORT &>/dev/null &
else
  echo "Python introuvable. Installez-le avec : sudo apt install python3"
  exit 1
fi

SERVER_PID=$!
sleep 1

# Ouvrir dans Chrome / Chromium
if command -v google-chrome &>/dev/null; then
  google-chrome "$URL" &
elif command -v chromium-browser &>/dev/null; then
  chromium-browser "$URL" &
elif command -v chromium &>/dev/null; then
  chromium "$URL" &
else
  xdg-open "$URL" &
fi

echo "Serveur démarré (PID $SERVER_PID)"
echo "Ouvrez : $URL"
echo "Installez l'app via l'icône ⊕ dans la barre d'adresse de Chrome."
echo "Appuyez sur Entrée pour arrêter le serveur."
read
kill $SERVER_PID 2>/dev/null
echo "Serveur arrêté."
