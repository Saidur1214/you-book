# Update 1 - Major UI/UX fix 
[Deadline: --/--/--]

## Update to work on
    - [ ] Add option to create Name
    - [ ] When name is provided, create a custom profile with the first letter of the name
    - [ ] 


## Update in Queue
    - [ ] Check whether the URL already exists in the DB
    - [ ] If it does, show the existing post instead of creating a new one
    - [ ] Track read vs unread posts (button for now)
    - [ ] Show unread posts on top of the feed
    - [ ] ...


### V1.1 [Done]
    - [done] Don't disable the send button; clear the URL bar after submit
    - [done] Let users add more URLs while one is processing
    - [done] Store queued URLs (server-side, so they survive a closed tab)
    - [done] Process the next URL as soon as the previous one finishes
    - [done] Let users read previous posts during the wait
    - [done] Rename "ai" to "AI"
    - [done] Show a placeholder card or progress status in the feed while waiting

### Working On -> v1.2
    - [ ] Create a function to generate a subject for each post
    - [ ] Work On mobile UI
    - [ ] Create a floating window in mobile UI
    - [ ] Add Sign Out button, Progress Tab, Add Resource
    - [ ] Don't Hide the Float winodow instantly when user click submit


### Today: Build the Whop checkout page
   - [ ] Create a separate branch from master just for the checkout work
   - [ ] Implement the Whop checkout page on that branch
   - [ ] Push the checkout update from that branch into main









### Re-check the “empty template” bug (before final production)
    - [ ] Reproduce it: submit a URL → button disables while the video processes → press Back
    - [ ] What goes wrong: the floating window disappears and a permanent empty template stays in the feed.
    - [ ] Suspicion: it may already be fixed in the v1.1 update, but that’s unconfirmed.
    - [ ] Test it on v1.1 before the software goes to final production. If it still happens, treat it as a blocker, because a stuck empty card in the feed will be visible to real users.

### Future Plan
    - [ ] Add like/dislike buttons to learn user taste and add variety
    - [ ] Study hook methods to make posts more engaging
    - [ ] Build an admin panel to manage users
    - [ ] Send all queued URLs in one click and split them into separate posts
    - [ ] Generate 2 posts per URL: show one, store the other for the next login
