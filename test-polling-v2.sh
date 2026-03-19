#!/bin/bash

echo "=== Testing Background Sync and Polling ==="
echo

# Start the sync
echo "1. Starting sync..."
curl -s -X POST http://localhost:3000/api/import-tiktok -w "\nResponse time: %{time_total}s\n" 2>/dev/null | head -3

sleep 0.5

# Poll for progress 5 times while sync is running
echo
echo "2. Polling for progress while sync runs..."
for i in {1..5}; do
  start=$(date +%s%N)
  response=$(curl -s http://localhost:3000/api/import-tiktok/progress)
  end=$(date +%s%N)
  duration=$(( ($end - $start) / 1000000 ))
  
  # Extract fields without jq
  status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  processed=$(echo "$response" | grep -o '"processedCount":[0-9]*' | cut -d':' -f2)
  total=$(echo "$response" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
  
  echo "Poll #$i: Status=$status | Progress=$processed/$total | Time=${duration}ms"
  sleep 0.8
done

echo
echo "=== Complete ==="
