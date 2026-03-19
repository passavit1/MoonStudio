#!/bin/bash

echo "=== Testing Sync Performance ==="
echo

# Test 1: Check if import endpoint returns quickly
echo "1. Testing POST /api/import-tiktok (should return immediately)"
time_start=$(date +%s%N)
curl -s -X POST http://localhost:3000/api/import-tiktok | jq .
time_end=$(date +%s%N)
duration=$((($time_end - $time_start) / 1000000))
echo "Response time: ${duration}ms"
echo

# Test 2: Quickly poll progress while sync is running
echo "2. Testing polling - first 5 requests should complete quickly"
for i in {1..5}; do
  echo "Poll #$i:"
  time_start=$(date +%s%N)
  response=$(curl -s http://localhost:3000/api/import-tiktok/progress)
  time_end=$(date +%s%N)
  duration=$((($time_end - $time_start) / 1000000))
  
  status=$(echo $response | jq -r '.status // "unknown"')
  processed=$(echo $response | jq -r '.processedCount // 0')
  total=$(echo $response | jq -r '.totalCount // 0')
  
  echo "  Status: $status | Progress: $processed/$total | Response time: ${duration}ms"
  sleep 0.5
done

echo
echo "=== Test Complete ==="
