#!/usr/bin/env bash
# ============================================================
#  JBE Commerce — API curl Test Script
#  Usage:  ./api_tests.sh [BASE_URL]
#  Default BASE_URL: http://localhost:3001
# ============================================================

BASE="${1:-http://localhost:3001}"
COOKIE_JAR="/tmp/jbe_cookies.txt"
PASS=0
FAIL=0
TOTAL=0

# ---- helpers ------------------------------------------------
green(){ echo -e "\033[32m$*\033[0m"; }
red()  { echo -e "\033[31m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

expect(){
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL+1))
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS+1))
    green "  ✓ $label (HTTP $actual)"
  else
    FAIL=$((FAIL+1))
    red   "  ✗ $label — expected HTTP $expected, got HTTP $actual"
  fi
}

check_body(){
  local label="$1" pattern="$2" body="$3"
  TOTAL=$((TOTAL+1))
  if echo "$body" | grep -q "$pattern"; then
    PASS=$((PASS+1))
    green "  ✓ $label (body contains '$pattern')"
  else
    FAIL=$((FAIL+1))
    red   "  ✗ $label — body does not contain '$pattern'"
    echo  "    Body: $body"
  fi
}

curl_get()  { curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -o /tmp/jbe_body.txt -w "%{http_code}" "$BASE$1"; }
curl_post() { curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST -H "Content-Type: application/json" -d "$2" -o /tmp/jbe_body.txt -w "%{http_code}" "$BASE$1"; }
curl_patch(){ curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X PATCH -H "Content-Type: application/json" -d "$2" -o /tmp/jbe_body.txt -w "%{http_code}" "$BASE$1"; }
body(){ cat /tmp/jbe_body.txt; }

UNIQUE_EMAIL="testuser_$$@example.com"

rm -f "$COOKIE_JAR"

# ============================================================
bold "\n=== 1. PRODUCTS ==="
# ============================================================

bold "\n--- 1a. GET /api/product (all products) ---"
STATUS=$(curl_get /api/product)
expect "happy path — returns 200" 200 "$STATUS"
check_body "body has 'message' key" '"message"' "$(body)"

bold "\n--- 1b. GET /api/product/categories ---"
STATUS=$(curl_get /api/product/categories)
expect "categories — returns 200" 200 "$STATUS"
check_body "body is an array" '\[' "$(body)"

bold "\n--- 1c. GET unknown route (edge case) ---"
STATUS=$(curl_get /api/doesnotexist)
expect "unknown route — returns 404" 404 "$STATUS"
check_body "404 has failure status" '"failure"' "$(body)"

# ============================================================
bold "\n=== 2. AUTH — SIGNUP ==="
# ============================================================

bold "\n--- 2a. Signup — missing password (error) ---"
STATUS=$(curl_post /api/auth/signup '{"name":"Alice","email":"alice@test.com"}')
expect "missing password — returns 400" 400 "$STATUS"
check_body "error message present" '"failure"' "$(body)"

bold "\n--- 2b. Signup — passwords do not match (error) ---"
STATUS=$(curl_post /api/auth/signup "{\"name\":\"Alice\",\"email\":\"mismatch_$$@test.com\",\"password\":\"abc123\",\"confirmPassword\":\"xyz999\"}")
expect "password mismatch — returns 400" 400 "$STATUS"
check_body "mismatch message" 'do not match' "$(body)"

bold "\n--- 2c. Signup — empty body (edge case) ---"
STATUS=$(curl_post /api/auth/signup '{}')
expect "empty body — returns 400 or 500" "" "$STATUS"
if [ "$STATUS" = "400" ] || [ "$STATUS" = "500" ]; then
  PASS=$((PASS+1)); green "  ✓ empty body returns error ($STATUS)"
else
  FAIL=$((FAIL+1)); red "  ✗ empty body — unexpected status $STATUS"
fi

bold "\n--- 2d. Signup — happy path ---"
STATUS=$(curl_post /api/auth/signup "{\"name\":\"TestUser\",\"email\":\"$UNIQUE_EMAIL\",\"password\":\"pass1234\",\"confirmPassword\":\"pass1234\"}")
expect "valid signup — returns 201" 201 "$STATUS"
check_body "success status in body" '"success"' "$(body)"

bold "\n--- 2e. Signup — duplicate email (edge case) ---"
STATUS=$(curl_post /api/auth/signup "{\"name\":\"TestUser\",\"email\":\"$UNIQUE_EMAIL\",\"password\":\"pass1234\",\"confirmPassword\":\"pass1234\"}")
expect "duplicate email — returns 500" 500 "$STATUS"

# ============================================================
bold "\n=== 3. AUTH — LOGIN ==="
# ============================================================

bold "\n--- 3a. Login — user not found (error) ---"
STATUS=$(curl_post /api/auth/login '{"email":"nobody@nope.com","password":"wrong"}')
expect "user not found — returns 404" 404 "$STATUS"

bold "\n--- 3b. Login — wrong password (error) ---"
STATUS=$(curl_post /api/auth/login "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"wrongpass\"}")
expect "wrong password — returns 404" 404 "$STATUS"

bold "\n--- 3c. Login — missing email (edge case) ---"
STATUS=$(curl_post /api/auth/login '{"password":"pass1234"}')
expect "missing email — returns 404 or 500" "" "$STATUS"
if [ "$STATUS" = "404" ] || [ "$STATUS" = "500" ]; then
  PASS=$((PASS+1)); green "  ✓ missing email returns error ($STATUS)"
else
  FAIL=$((FAIL+1)); red "  ✗ missing email — unexpected status $STATUS"
fi

bold "\n--- 3d. Login — happy path ---"
STATUS=$(curl_post /api/auth/login "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"pass1234\"}")
expect "valid login — returns 200" 200 "$STATUS"
check_body "success status in body" '"success"' "$(body)"
check_body "JWT cookie set" "JWT" "$(cat $COOKIE_JAR 2>/dev/null)"

# ============================================================
bold "\n=== 4. AUTH — LOGOUT ==="
# ============================================================

bold "\n--- 4a. GET /logout ---"
STATUS=$(curl_get /api/auth/logout)
expect "GET logout — returns 200" 200 "$STATUS"

bold "\n--- 4b. POST /logout ---"
STATUS=$(curl_post /api/auth/logout '{}')
expect "POST logout — returns 200" 200 "$STATUS"
check_body "success in body" '"success"' "$(body)"

# ============================================================
bold "\n=== 5. AUTH — FORGOT + RESET PASSWORD ==="
# ============================================================

bold "\n--- 5a. Forgot password — email not found (error) ---"
STATUS=$(curl_patch /api/auth/forgetpassword '{"email":"nobody@nope.com"}')
expect "unknown email — returns 404" 404 "$STATUS"

bold "\n--- 5b. Forgot password — missing email (edge case) ---"
STATUS=$(curl_patch /api/auth/forgetpassword '{}')
expect "missing email — returns 404 or 500" "" "$STATUS"
if [ "$STATUS" = "404" ] || [ "$STATUS" = "500" ]; then
  PASS=$((PASS+1)); green "  ✓ missing email returns error ($STATUS)"
else
  FAIL=$((FAIL+1)); red "  ✗ missing email — unexpected status $STATUS"
fi

bold "\n--- 5c. Reset password — invalid userId (edge case) ---"
STATUS=$(curl_patch /api/auth/resetPassword/000000000000000000000000 '{"password":"new123","confirmPasword":"new123","otp":"999999"}')
expect "invalid userId — returns 404 or 500" "" "$STATUS"
if [ "$STATUS" = "404" ] || [ "$STATUS" = "500" ]; then
  PASS=$((PASS+1)); green "  ✓ invalid userId returns error ($STATUS)"
else
  FAIL=$((FAIL+1)); red "  ✗ invalid userId — unexpected status $STATUS"
fi

# ============================================================
bold "\n=== 6. REVIEWS ==="
# ============================================================
FAKE_ID="507f1f77bcf86cd799439011"

bold "\n--- 6a. GET reviews for product — happy path ---"
STATUS=$(curl_get /api/review/$FAKE_ID)
expect "get reviews — returns 200" 200 "$STATUS"
check_body "body has data array" '"data"' "$(body)"
check_body "pagination total present" '"total"' "$(body)"

bold "\n--- 6b. GET reviews — with pagination params ---"
STATUS=$(curl_get "/api/review/$FAKE_ID?page=2&limit=5")
expect "paginated reviews — returns 200" 200 "$STATUS"
check_body "page=2 in response" '"page":2' "$(body)"

bold "\n--- 6c. GET reviews — invalid page (edge case) ---"
STATUS=$(curl_get "/api/review/$FAKE_ID?page=abc")
expect "invalid page param — returns 200 with page=1" 200 "$STATUS"
check_body "defaults to page 1" '"page":1' "$(body)"

bold "\n--- 6d. POST review — not authenticated (error) ---"
rm -f "$COOKIE_JAR"   # clear cookies
STATUS=$(curl_post /api/review/$FAKE_ID '{"review":"Great!","rating":5}')
expect "no auth — returns 500" 500 "$STATUS"

# ============================================================
bold "\n=== 7. BOOKINGS ==="
# ============================================================

bold "\n--- 7a. POST booking — not authenticated (error) ---"
STATUS=$(curl_post /api/booking/$FAKE_ID '{"quantity":1}')
expect "no auth booking — returns 500" 500 "$STATUS"

bold "\n--- 7b. GET all bookings — not authenticated ---"
STATUS=$(curl_get /api/booking/)
expect "get bookings no auth — returns 500" 500 "$STATUS"

# ============================================================
bold "\n=== 8. SUMMARY ==="
# ============================================================
echo ""
bold "Results: $PASS/$TOTAL passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && green "All tests passed!" || red "$FAIL test(s) failed."
exit $FAIL
