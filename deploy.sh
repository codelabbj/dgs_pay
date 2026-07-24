#!/bin/bash
set -e  # Arrêter en cas d'erreur

echo "🚀 Début du déploiement Dashboard DGS Pay..."
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Variables de configuration
PROJECT_DIR="/root/dgs-dashboard/dgs_pay"
APP_NAME="dgs-dashboard"    # Nom du processus PM2
PORT=3000                   # Port de l'application (à adapter si besoin)

# Navigation vers le répertoire du projet
echo ""
echo "📂 Navigation vers le répertoire du projet..."
cd "$PROJECT_DIR"

# Git pull
echo ""
echo "📥 Récupération du code depuis Git..."
git pull origin main

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances..."
pnpm install --frozen-lockfile

# Build de l'application Next.js
echo ""
echo "🔨 Build de l'application Next.js..."
pnpm build

# Vérification que le build a réussi
if [ ! -d ".next" ]; then
    echo "❌ Le build a échoué - dossier .next introuvable"
    exit 1
fi
echo "✅ Build réussi"

# Redémarrage via PM2
echo ""
echo "🔄 Redémarrage de l'application via PM2..."

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo "   Application '$APP_NAME' trouvée - redémarrage..."
    pm2 restart "$APP_NAME"
else
    echo "   Application '$APP_NAME' non trouvée - démarrage..."
    pm2 start pnpm --name "$APP_NAME" -- start -- --port $PORT
fi

# Sauvegarde de la liste PM2 (pour redémarrage après reboot)
pm2 save

# Attente que le service démarre
echo ""
echo "⏳ Attente du démarrage du service..."
sleep 5

# Vérification du statut
APP_STATUS=$(pm2 describe "$APP_NAME" 2>/dev/null | grep -i "status" | head -1 || echo "unknown")
echo "   Statut PM2: $APP_STATUS"

# Nettoyage du cache pnpm
echo ""
echo "🧹 Nettoyage du cache pnpm..."
pnpm store prune --force 2>/dev/null || true
echo "✅ Nettoyage terminé"

# Résumé final
echo ""
echo "========================================"
echo "📊 STATUT FINAL"
echo "========================================"
echo ""
pm2 status "$APP_NAME" 2>/dev/null || pm2 list

echo ""
echo "========================================"
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
echo "========================================"
echo ""

# Commandes utiles
echo "📋 COMMANDES UTILES:"
echo ""
echo "Statut de l'application:"
echo "   pm2 status $APP_NAME"
echo "   pm2 describe $APP_NAME"
echo ""
echo "Logs en temps réel:"
echo "   pm2 logs $APP_NAME              # Tous les logs"
echo "   pm2 logs $APP_NAME --lines 100  # Les 100 dernières lignes"
echo ""
echo "Redémarrer / Arrêter:"
echo "   pm2 restart $APP_NAME"
echo "   pm2 stop $APP_NAME"
echo "   pm2 delete $APP_NAME"
echo ""
echo "Build manuel:"
echo "   cd $PROJECT_DIR && pnpm build"
echo ""

# Option pour afficher les logs
read -t 10 -p "Afficher les logs en temps réel ? (y/N): " -n 1 -r 2>/dev/null || echo ""
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📜 Logs $APP_NAME (Ctrl+C pour quitter)..."
    pm2 logs "$APP_NAME"
fi

echo ""
echo "🎉 Fin du déploiement - $(date '+%Y-%m-%d %H:%M:%S')"
