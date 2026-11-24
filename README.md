# Commons Board

Commons Board helps a small community decide what to do next. A Gno realm stores proposals, voting deadlines, and public yes/no totals. The address that owns the realm namespace admits members, and every admitted member can create a proposal and vote once per proposal.

[Try the interactive preview](https://jeyloo2026.github.io/commons-board/). The preview simulates votes in the browser. Its data resets when the page reloads.

## Try locally

Install the [Gno toolchain](https://docs.gno.land/builders/install/). Set the module path in `commonsboard/gnomod.toml` to `gno.land/r/<administrator-address>/board`, using an address from your local keyring. With that path, the administrator can add members on both the local network and testnet.

```sh
cd commonsboard
gno test .
gnodev .
```

Open the realm in the local gnoweb at http://localhost:8888. The **Actions** tab provides wallet forms and transaction commands.

1. With the administrator account, use `AddMember` to add two test accounts. The administrator can also add their own address.
2. With a member account, use `Propose` to ask “Should we host a Go workshop next week?” and set a duration in minutes.
3. Use `Vote` with the proposal ID and approve or reject. The page shows the totals and deadline. A second vote by the same member is rejected. At the deadline, the poll closes and the page displays the outcome.

## Testnet demo

Deploy to Onyx under the administrator's address using the [official testnet deployment guide](https://docs.gno.land/builders/getting-started/#deploy-to-a-shared-network). The demo needs the realm URL, a successful proposal and two votes, a rejected repeat vote, and the final result after the deadline.

The board supports 50 proposals. Voting addresses and results appear in public blockchain data.
