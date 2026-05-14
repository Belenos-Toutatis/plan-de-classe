#!/bin/bash
# Script de lancement pour macOS — double-cliquable depuis le Finder.
# Si le double-clic ne fonctionne pas, faire dans le Terminal :
#   chmod +x lancer-installation.command
# puis double-cliquer.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PORT=8765
URL="http://localhost:$PORT/plan de classe.html"

echo "========================================"
echo "  Plan de Classe — Lancement local"
echo "========================================"
echo ""

# Vérifier que le fichier HTML est bien là
if [ ! -f "plan de classe.html" ]; then
  echo "[ERREUR] Fichier 'plan de classe.html' introuvable dans ce dossier."
  echo "Placez ce script dans le même dossier que le fichier HTML."
  echo ""
  echo "Appuyez sur Entrée pour fermer."
  read
  exit 1
fi

# Démarrer le serveur HTTP en arrière-plan
if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT &>/dev/null &
elif command -v python &>/dev/null; then
  python -m http.server $PORT &>/dev/null &
else
  echo "[ERREUR] Python introuvable."
  echo "Installez-le via Homebrew :"
  echo "  brew install python3"
  echo ""
  echo "Ou téléchargez-le sur https://www.python.org/downloads/"
  echo ""
  echo "Appuyez sur Entrée pour fermer."
  read
  exit 1
fi

SERVER_PID=$!
sleep 1

# Ouvrir dans Chrome de préférence (pour la compatibilité PWA / File System Access)
if [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" "$URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -a "Microsoft Edge" "$URL"
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -a "Brave Browser" "$URL"
else
  open "$URL"   # navigateur par défaut (Safari probable — fonctionnalités réduites)
fi

echo "Serveur démarré sur http://localhost:$PORT (PID $SERVER_PID)"
echo ""
echo "Le navigateur va s'ouvrir."
echo "Pour installer l'app comme une vraie application :"
echo "  Chrome / Edge → menu ⋮ → 'Installer Plan de Classe…'"
echo ""
echo "Appuyez sur Entrée dans cette fenêtre pour ARRÊTER le serveur."
read

kill $SERVER_PID 2>/dev/null
echo "Serveur arrêté."
sleep 1
