#!/bin/sh

# Replace environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Replace environment variables in JavaScript files
if [ -n "$VITE_API_BASE_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|$VITE_API_BASE_URL|g" {} \;
fi

# Start nginx
exec "$@"