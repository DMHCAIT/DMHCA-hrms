#!/bin/bash

echo "🔍 Testing DMHCA Backend on Render..."
echo "================================================="

echo "1. Testing root endpoint:"
curl -s -w "Status: %{http_code}\n" https://dmhca-hrms.onrender.com/ | head -5

echo -e "\n2. Testing health endpoint:"
curl -s -w "Status: %{http_code}\n" https://dmhca-hrms.onrender.com/health | head -5

echo -e "\n3. Testing API endpoints:"
curl -s -w "Status: %{http_code}\n" https://dmhca-hrms.onrender.com/api/employees | head -5

echo -e "\n4. Testing CORS (simulating browser request):"
curl -s -X OPTIONS \
  -H "Origin: https://www.dmhcahrms.xyz" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "Status: %{http_code}\n" \
  https://dmhca-hrms.onrender.com/health

echo -e "\n================================================="
echo "If all endpoints return 404, your backend is not deployed correctly."