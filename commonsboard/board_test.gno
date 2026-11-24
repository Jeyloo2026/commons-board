package board

import (
	"testing"
	"time"
)

func TestVoteCountsAndRejectsDuplicate(t *testing.T) {
	now := time.Unix(100, 0)
	p := &proposal{
		deadline: now.Add(time.Minute),
		votes: make(map[address]bool),
	}
	alice := address("g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5")
	bob := address("g1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqluuxe")
	p.cast(alice, true, now)
	p.cast(bob, false, now)
	expectVotePanic(t, "address has already voted", func() {
		p.cast(alice, false, now)
	})
	if p.yes != 1 || p.no != 1 {
		t.Fatalf("expected one yes and one no, got %d and %d", p.yes, p.no)
	}
}

func TestVoteClosesAtDeadline(t *testing.T) {
	deadline := time.Unix(100, 0)
	p := &proposal{deadline: deadline, votes: make(map[address]bool)}
	expectVotePanic(t, "voting is closed", func() {
		p.cast(address("g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5"), true, deadline)
	})
	if len(p.votes) != 0 || p.yes != 0 || p.no != 0 {
		t.Fatal("a rejected vote changed the proposal")
	}
}

func expectVotePanic(t *testing.T, want string, call func()) {
	defer func() {
		if got := recover(); got != want {
			t.Errorf("expected panic %q, got %v", want, got)
		}
	}()
	call()
}
