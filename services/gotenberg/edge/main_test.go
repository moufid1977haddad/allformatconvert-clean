package main

import (
	"crypto/ed25519"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

// A fake isolated service (back) behind a fake local Gotenberg, and the front relaying to it: the whole chain in memory.
func chain(t *testing.T, now func() time.Time) (front *httptest.Server, seen *[]*http.Request) {
	t.Helper()
	var got []*http.Request
	gotenberg := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = append(got, r.Clone(r.Context()))
		b, _ := io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "application/pdf")
		io.WriteString(w, "%PDF-from-"+r.URL.Path+"-"+string(b))
	})
	key := DeriveKey("user", "pass")
	back := httptest.NewTLSServer(BackHandler([]ed25519.PublicKey{key.Public().(ed25519.PublicKey)}, gotenberg, now))
	t.Cleanup(back.Close)
	remote, _ := url.Parse(back.URL)
	localFront := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { io.WriteString(w, "local:"+r.URL.Path) })
	h := FrontHandler("user", "pass", remote, key, localFront, now, back.Client().Transport) // trusts the test TLS server
	front = httptest.NewServer(h)
	t.Cleanup(front.Close)
	return front, &got
}

func TestSignVerify(t *testing.T) {
	k := DeriveKey("u", "p")
	pub := []ed25519.PublicKey{k.Public().(ed25519.PublicKey)}
	now := time.Unix(1_790_000_000, 0)
	h := Sign(k, now, "POST", "/forms/chromium/convert/html")
	if err := Verify(pub, now.Add(119*time.Second), h, "POST", "/forms/chromium/convert/html"); err != nil {
		t.Fatal(err)
	}
	for name, c := range map[string][3]string{
		"other path":   {h, "POST", "/forms/chromium/convert/url"},
		"other method": {h, "GET", "/forms/chromium/convert/html"},
		"garbage":      {"123.abc", "POST", "/forms/chromium/convert/html"},
		"empty":        {"", "POST", "/forms/chromium/convert/html"},
	} {
		if Verify(pub, now, c[0], c[1], c[2]) == nil {
			t.Errorf("%s accepted", name)
		}
	}
	if Verify(pub, now.Add(121*time.Second), h, "POST", "/forms/chromium/convert/html") == nil {
		t.Error("expired signature accepted")
	}
	other := DeriveKey("u", "other")
	if Verify(pub, now, Sign(other, now, "POST", "/x"), "POST", "/x") == nil {
		t.Error("foreign key accepted")
	}
	if DeriveKey("u", "p").Public().(ed25519.PublicKey).Equal(other.Public()) {
		t.Error("key does not depend on the password")
	}
}

func TestFrontBack(t *testing.T) {
	front, seen := chain(t, time.Now)
	post := func(path, user, pass string) (int, string) {
		req, _ := http.NewRequest("POST", front.URL+path, strings.NewReader("body"))
		if user != "" {
			req.SetBasicAuth(user, pass)
		}
		r, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(r.Body)
		return r.StatusCode, string(b)
	}
	if c, b := post("/forms/chromium/convert/html", "user", "pass"); c != 200 || b != "%PDF-from-/forms/chromium/convert/html-body" {
		t.Fatalf("relay: %d %q", c, b)
	}
	if h := (*seen)[0].Header; h.Get("Authorization") != "" || h.Get(signatureHdr) != "" {
		t.Error("credentials or signature reached the isolated Gotenberg")
	}
	if c, _ := post("/forms/chromium/convert/html", "user", "wrong"); c != 401 {
		t.Errorf("bad password: %d", c)
	}
	if c, _ := post("/forms/chromium/convert/html", "", ""); c != 401 {
		t.Errorf("no auth: %d", c)
	}
	if c, b := post("/forms/libreoffice/convert", "", ""); c != 200 || b != "local:/forms/libreoffice/convert" {
		t.Errorf("libreoffice stays local: %d %q", c, b)
	}
	if len(*seen) != 1 {
		t.Errorf("unauthenticated requests reached the isolated service: %d", len(*seen))
	}
}

func TestBackRefuses(t *testing.T) {
	key := DeriveKey("user", "pass")
	reached := 0
	g := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { reached++ })
	back := httptest.NewServer(BackHandler([]ed25519.PublicKey{key.Public().(ed25519.PublicKey)}, g, time.Now))
	defer back.Close()
	do := func(method, path, sig string) int {
		req, _ := http.NewRequest(method, back.URL+path, nil)
		if sig != "" {
			req.Header.Set(signatureHdr, sig)
		}
		r, _ := http.DefaultClient.Do(req)
		return r.StatusCode
	}
	if do("POST", "/forms/chromium/convert/html", "") != 403 {
		t.Error("unsigned accepted")
	}
	if do("POST", "/forms/libreoffice/convert", Sign(key, time.Now(), "POST", "/forms/libreoffice/convert")) != 404 {
		t.Error("libreoffice reachable on the isolated service")
	}
	if do("POST", "/forms/pdfengines/merge", Sign(key, time.Now(), "POST", "/forms/pdfengines/merge")) != 404 {
		t.Error("pdfengines reachable")
	}
	if do("GET", "/version", "") != 404 {
		t.Error("version reachable unsigned")
	}
	if reached != 0 {
		t.Errorf("refused requests reached gotenberg: %d", reached)
	}
	if do("GET", "/health", "") != 200 || reached != 1 {
		t.Error("health not served")
	}
	if do("POST", "/forms/chromium/convert/html", Sign(key, time.Now(), "POST", "/forms/chromium/convert/html")) != 200 || reached != 2 {
		t.Error("signed request refused")
	}
}

func TestArgs(t *testing.T) {
	f, b := strings.Join(gotenbergArgs("front"), " "), strings.Join(gotenbergArgs("back"), " ")
	for _, want := range []string{"--api-bind-ip=127.0.0.1", "--api-enable-basic-auth", "--chromium-disable-routes"} {
		if !strings.Contains(f, want) {
			t.Errorf("front lacks %s", want)
		}
	}
	for _, want := range []string{"--api-bind-ip=127.0.0.1", "--libreoffice-disable-routes", "--chromium-disable-javascript", "--chromium-clear-cookies"} {
		if !strings.Contains(b, want) {
			t.Errorf("back lacks %s", want)
		}
	}
	if strings.Contains(b, "basic-auth") || strings.Contains(b, "chromium-disable-routes") {
		t.Error("back args wrong")
	}
}

func TestSecretLooking(t *testing.T) {
	got := secretLooking([]string{"OCT_TRUSTED_KEYS=abc", "PORT=3000", "CHROMIUM_DENY_LIST=x", "RAILWAY_PUBLIC_DOMAIN=x", "GOTENBERG_API_BASIC_AUTH_USERNAME=u", "MY_TOKEN=t", "DB_PASSWORD=p", "API_SECRET=s"})
	if strings.Join(got, ",") != "GOTENBERG_API_BASIC_AUTH_USERNAME,MY_TOKEN,DB_PASSWORD,API_SECRET" {
		t.Fatalf("got %v", got)
	}
	if !sameCredentials("user", "pass", "user", "pass") || sameCredentials("user", "pas", "user", "pass") || sameCredentials("usr", "pass", "user", "pass") {
		t.Fatal("credential comparison wrong")
	}
}
