// oct-edge (P30, 04/10): moves Gotenberg's Chromium out of the service that holds our secrets and reaches our private
// network. One image, two roles (OCT_EDGE_MODE):
//
//   front (default; gotenberg-v2 and gotenberg-fonts): Gotenberg runs on 127.0.0.1:3001 with its Chromium routes
//     disabled; this process listens on $PORT, checks Gotenberg's own Basic Auth for /forms/chromium/* and relays those
//     requests to the isolated Chromium service (OCT_CHROMIUM_URL), signed; everything else goes to the local Gotenberg
//     unchanged (which checks its Basic Auth itself).
//
//   back (the isolated service, in its own Railway project: no private network shared with ours, no secret): Gotenberg
//     runs on 127.0.0.1:3001 with LibreOffice disabled and no Basic Auth; this process lets through only /health and
//     /forms/chromium/* requests that carry a valid signature of the front, checked with PUBLIC keys
//     (OCT_TRUSTED_KEYS). Nothing on this service can sign: a compromised Chromium there learns no credential.
//
// Signature: Ed25519 over "oct-edge-v1\n<unix seconds>\n<method>\n<request URI>", accepted for 120 s. The front's key is
// derived from Gotenberg's existing Basic Auth credentials (no new variable): seed = SHA-256("oct-chromium-isolated-v1"
// 0 username 0 password). Changing the password changes the key: the public key in the Dockerfile must then follow.
// The process also starts Gotenberg as its child and exits when it does (Railway restarts the container).
package main

import (
	"context"
	"crypto/ed25519"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	gotenbergAddr  = "127.0.0.1:3001"
	signatureHdr   = "Oct-Edge-Signature"
	signatureLabel = "oct-edge-v1"
	maxSkew        = 120 * time.Second
	chromiumPrefix = "/forms/chromium/"
)

// DeriveKey is the front's signing key, from Gotenberg's Basic Auth credentials.
func DeriveKey(username, password string) ed25519.PrivateKey {
	h := sha256.New()
	h.Write([]byte("oct-chromium-isolated-v1"))
	h.Write([]byte{0})
	h.Write([]byte(username))
	h.Write([]byte{0})
	h.Write([]byte(password))
	return ed25519.NewKeyFromSeed(h.Sum(nil))
}

func message(ts int64, method, uri string) []byte {
	return []byte(fmt.Sprintf("%s\n%d\n%s\n%s", signatureLabel, ts, method, uri))
}

// Sign returns the header value for one request.
func Sign(key ed25519.PrivateKey, now time.Time, method, uri string) string {
	ts := now.Unix()
	return fmt.Sprintf("%d.%s", ts, base64.RawURLEncoding.EncodeToString(ed25519.Sign(key, message(ts, method, uri))))
}

// Verify checks a header value against the trusted public keys.
func Verify(keys []ed25519.PublicKey, now time.Time, header, method, uri string) error {
	tsPart, sigPart, ok := strings.Cut(header, ".")
	if !ok {
		return errors.New("malformed signature")
	}
	ts, err := strconv.ParseInt(tsPart, 10, 64)
	if err != nil {
		return errors.New("malformed timestamp")
	}
	if d := now.Sub(time.Unix(ts, 0)); d > maxSkew || d < -maxSkew {
		return errors.New("signature expired")
	}
	sig, err := base64.RawURLEncoding.DecodeString(sigPart)
	if err != nil || len(sig) != ed25519.SignatureSize {
		return errors.New("malformed signature")
	}
	msg := message(ts, method, uri)
	for _, k := range keys {
		if ed25519.Verify(k, msg, sig) {
			return nil
		}
	}
	return errors.New("unknown signer")
}

func parseKeys(s string) ([]ed25519.PublicKey, error) {
	var keys []ed25519.PublicKey
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		b, err := base64.RawURLEncoding.DecodeString(part)
		if err != nil || len(b) != ed25519.PublicKeySize {
			return nil, fmt.Errorf("bad public key %q", part)
		}
		keys = append(keys, ed25519.PublicKey(b))
	}
	if len(keys) == 0 {
		return nil, errors.New("no trusted key")
	}
	return keys, nil
}

func localProxy() *httputil.ReverseProxy {
	target := &url.URL{Scheme: "http", Host: gotenbergAddr}
	p := httputil.NewSingleHostReverseProxy(target)
	p.Transport = &http.Transport{ResponseHeaderTimeout: 300 * time.Second, MaxIdleConnsPerHost: 16}
	p.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("oct-edge: local gotenberg unreachable: %v", err)
		http.Error(w, "Gotenberg is starting or unavailable", http.StatusBadGateway)
	}
	return p
}

// FrontHandler: Basic Auth for the Chromium routes, then a signed relay to the isolated service.
func FrontHandler(username, password string, remote *url.URL, key ed25519.PrivateKey, local http.Handler, now func() time.Time, transport http.RoundTripper) http.Handler {
	if transport == nil {
		transport = &http.Transport{ResponseHeaderTimeout: 300 * time.Second, MaxIdleConnsPerHost: 16, ForceAttemptHTTP2: true}
	}
	relay := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(remote)
			pr.Out.Host = remote.Host
			pr.Out.Header.Del("Authorization") // Gotenberg's credentials never leave this service
			pr.Out.Header.Del(signatureHdr)
			pr.Out.Header.Set(signatureHdr, Sign(key, now(), pr.Out.Method, pr.Out.URL.RequestURI()))
		},
		Transport: transport,
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			log.Printf("oct-edge: chromium service unreachable: %v", err)
			http.Error(w, "Chromium service unreachable", http.StatusBadGateway)
		},
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, chromiumPrefix) {
			local.ServeHTTP(w, r)
			return
		}
		u, p, ok := r.BasicAuth()
		if !ok || subtle.ConstantTimeCompare([]byte(u), []byte(username)) != 1 || subtle.ConstantTimeCompare([]byte(p), []byte(password)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		relay.ServeHTTP(w, r)
	})
}

// BackHandler: only /health and signed Chromium requests reach the local Gotenberg.
func BackHandler(keys []ed25519.PublicKey, local http.Handler, now func() time.Time) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" && (r.Method == http.MethodGet || r.Method == http.MethodHead) {
			local.ServeHTTP(w, r)
			return
		}
		if !strings.HasPrefix(r.URL.Path, chromiumPrefix) || strings.Contains(r.URL.Path, "..") {
			http.NotFound(w, r)
			return
		}
		if err := Verify(keys, now(), r.Header.Get(signatureHdr), r.Method, r.URL.RequestURI()); err != nil {
			log.Printf("oct-edge: refused %s %s: %v", r.Method, r.URL.Path, err)
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		r.Header.Del(signatureHdr)
		r.Header.Del("Authorization")
		local.ServeHTTP(w, r)
	})
}

// gotenbergArgs: the child's command line per role. Flags common to both roles come first, as before P30.
func gotenbergArgs(mode string) []string {
	args := []string{"--api-port=3001", "--api-bind-ip=127.0.0.1", "--chromium-disable-javascript", "--chromium-clear-cookies"}
	if mode == "back" {
		return append(args, "--libreoffice-disable-routes", "--libreoffice-auto-start=false")
	}
	return append(args, "--api-enable-basic-auth", "--chromium-disable-routes", "--chromium-auto-start=false")
}

func main() {
	log.SetFlags(0)
	mode := os.Getenv("OCT_EDGE_MODE")
	if mode == "" {
		mode = "front"
	}
	if mode != "front" && mode != "back" {
		log.Fatalf("oct-edge: OCT_EDGE_MODE must be front or back, not %q", mode)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	var handler http.Handler
	local := localProxy()
	if mode == "front" {
		user, pass := os.Getenv("GOTENBERG_API_BASIC_AUTH_USERNAME"), os.Getenv("GOTENBERG_API_BASIC_AUTH_PASSWORD")
		if user == "" || pass == "" {
			log.Fatal("oct-edge: front needs Gotenberg's Basic Auth credentials")
		}
		remote, err := url.Parse(os.Getenv("OCT_CHROMIUM_URL"))
		if err != nil || remote.Scheme != "https" || remote.Host == "" {
			log.Fatal("oct-edge: OCT_CHROMIUM_URL must be an https URL")
		}
		handler = FrontHandler(user, pass, remote, DeriveKey(user, pass), local, time.Now, nil)
	} else {
		keys, err := parseKeys(os.Getenv("OCT_TRUSTED_KEYS"))
		if err != nil {
			log.Fatalf("oct-edge: %v", err)
		}
		// The isolated service must hold no credential at all: refuse to start if Gotenberg's would be there.
		if os.Getenv("GOTENBERG_API_BASIC_AUTH_PASSWORD") != "" {
			log.Fatal("oct-edge: back must not receive Gotenberg's credentials")
		}
		handler = BackHandler(keys, local, time.Now)
	}

	cmd := exec.Command("gotenberg", gotenbergArgs(mode)...)
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if mode == "front" {
		// Railway's CHROMIUM_AUTO_START=true would win over --chromium-auto-start=false (measured on gotenberg-fonts,
		// 04/10): dropped, so no Chromium process exists at all in the front.
		cmd.Env = filterEnv(os.Environ(), "CHROMIUM_AUTO_START")
	} else {
		cmd.Env = filterEnv(os.Environ(), "OCT_TRUSTED_KEYS")
	}
	if err := cmd.Start(); err != nil {
		log.Fatalf("oct-edge: cannot start gotenberg: %v", err)
	}
	log.Printf("oct-edge: %s mode, gotenberg pid %d, listening on :%s", mode, cmd.Process.Pid, port)

	srv := &http.Server{Addr: ":" + port, Handler: handler, ReadHeaderTimeout: 30 * time.Second}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("oct-edge: listen: %v", err)
			_ = cmd.Process.Signal(syscall.SIGTERM)
		}
	}()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGTERM, syscall.SIGINT)
	select {
	case err := <-done:
		log.Printf("oct-edge: gotenberg exited: %v", err)
		os.Exit(1)
	case s := <-sigs:
		log.Printf("oct-edge: %v, shutting down", s)
		grace := 30 * time.Second
		if d, err := time.ParseDuration(os.Getenv("GOTENBERG_GRACEFUL_SHUTDOWN_DURATION")); err == nil && d > 0 {
			grace = d
		}
		ctx, cancel := context.WithTimeout(context.Background(), grace)
		defer cancel()
		_ = cmd.Process.Signal(syscall.SIGTERM)
		_ = srv.Shutdown(ctx)
		select {
		case <-done:
		case <-ctx.Done():
			_ = cmd.Process.Kill()
		}
	}
}

func filterEnv(env []string, drop ...string) []string {
	out := env[:0:0]
	for _, kv := range env {
		keep := true
		for _, d := range drop {
			if strings.HasPrefix(kv, d+"=") {
				keep = false
			}
		}
		if keep {
			out = append(out, kv)
		}
	}
	return out
}
