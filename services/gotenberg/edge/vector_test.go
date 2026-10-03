package main

import (
	"crypto/ed25519"
	"encoding/base64"
	"testing"
)

// The Node derivation of scripts/p30/edge-pubkey.mjs must give the same public key (vector computed there for u/p).
func TestDerivationVector(t *testing.T) {
	got := base64.RawURLEncoding.EncodeToString(DeriveKey("u", "p").Public().(ed25519.PublicKey))
	t.Log(got)
	if want := "-gcvfPuGtv88yuKMp4-Y1k855Z1yFQkqAOvwfgUjkvE"; got != want {
		t.Fatalf("got %s want %s", got, want)
	}
}
