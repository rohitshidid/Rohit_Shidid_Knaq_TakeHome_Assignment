# SOLUTION

Design decisions, trade-offs, and AI-tool disclosure. Filled in as the build
progresses so the reasoning is captured while it's fresh.


## Storage choice & schema
_TBD_

## Duplicates, malformed messages, threshold-breach flagging
_TBD_

## Status-transition enforcement (where it lives and why)
_TBD_

## Frontend state — Redux Toolkit / RTK Query structure
_TBD_

## Source of truth (server vs client) + optimistic vs pessimistic updates
_TBD_

## Trade-offs made under the time cap
_TBD_

## What I'd improve with another week
_TBD_

## Additional libraries added (and why)
_TBD_

## AI tool disclosure
_TBD_

## Miscellaneous notes
-  I use mac and have docker desktop installed and running, because macOS cannot run Docker natively, opening the app starts a required hidden Linux virtual machine in the background that actually runs your containers.
- I have created a homebrew tap which is available at: https://github.com/rohitshidid/Homebrew-portman (I'm a bit of a homebrew fanboy), it basically helps you see all active ports on your machine in one screen, it helps quite a lot when you are working with docker and/or kubernetes, helped me track progress as I was developing this application. (you can also use `brew install portmap` to install it)

