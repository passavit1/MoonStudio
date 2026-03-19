#!/bin/bash

echo "=== Testing Background Sync with Progress Polling ==="
echo

# Start the sync in background
echo "Starting sync (non-blocking POST)..."
curl -s -X POST http://localhost:3000/api/import-tiktok > /tmp/sync-response.txt &
SYNC_PID=$!

sleep 1

# Poll for progress up to 20 times
echo "Polling progress..."
for i in {1..20}; do
  response=$(curl -s http://localhost:3000/api/import-tiktok/progress 2>/dev/null)
  
  # Parse response
  status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  processed=$(echo "$response" | grep -o '"processedCount":[0-9]*' | cut -d':' -f2)
  total=$(echo "$response" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
  current_file=$(echo "$response" | grep -o '"currentFile":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$status" ]; then
    printf "Poll #%-2d: %10s | %3d/%3d | %s\n" "$i" "$status" "$processed" "$total" "$current_file"
  fi
  
  # Stop if sync completed
  if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
    echo "Sync finished!"
    break
  fi
  
  sleep 2
done

echo
echo "Sync response:"
cat /tmp/sync-response.txt

echo
echo "Done"
