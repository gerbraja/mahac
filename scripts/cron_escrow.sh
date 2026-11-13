#!/bin/bash

# Este script ejecuta el endpoint encargado de liberar los fondos Escrow
# de las Tiendas Virtuales (24h para calificaciones de 5-7 estrellas, 72h para 4 estrellas).

# URL local de tu servidor backend TEI
API_URL="http://127.0.0.1:8000/api/merchants/orders/cron/release-escrow"

echo "=========================================================="
echo "Ejecutando Cron Job de Liberación Escrow - $(date)"
echo "=========================================================="

# Hacemos la petición POST al endpoint interno
RESPONSE=$(curl -s -X POST "$API_URL" -H "accept: application/json")

echo "Respuesta del Servidor:"
echo "$RESPONSE"
echo "=========================================================="
