@echo off
echo Starting Vitalis Health App with Load Balancer...
echo.

echo Building and starting services...
docker-compose -f docker-compose.loadbalancer.yml up --build -d

echo.
echo ✅ Load Balancer Setup Complete!
echo.
echo 🌐 App: http://localhost
echo 📊 Traefik Dashboard: http://localhost:8080
echo 🗄️ MinIO Console: http://localhost:9001
echo.
echo Services running:
docker-compose -f docker-compose.loadbalancer.yml ps

pause