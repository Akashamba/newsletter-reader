# Concept

A “newsletter inbox” that:

- connects to Gmail
- fetches all emails (later selectively fetch only newsletter emails)
- provide a feed view with emails and nice reader view for each email
- be able to mark articles as read/unread, archive, and search (later tags + semantic search)

## API Endpoints

- GET all articles
- GET all articles (with sync: write to db)
- GET articles with search
- GET one article for reader view with sanitized body
- GET list of publishers
- PATCH article (rename, archive/unarchive, read/unread)

## DB Schema and Relations

- Users ( cretaed by better-auth already )
- Articles (
  -- id: uuid, primary_key,
  -- userId: uuid, foreign_key,
  -- publisherId: uuid, foreign_key,
  -- title: string,
  -- snippet: string,
  -- content: string,
  -- internalDate: string (int64 format) (The internal message creation timestamp (epoch ms), which determines ordering in the inbox, which might be useful to determine order in the feed)
  -- created_at: timestamp,
  -- updated_at: timestamp,
  )
- Publishers (
  -- id: uuid, primary_key,
  -- name: string,
  -- emailAddress: string,
  -- created_at: timestamp,
  -- updated_at: timestamp,
  )

  one User -> many Articles
  one Article -> one Publisher
  one Publisher -> many Articles

## Sync Process

- Fetch last N messages from Gmail (start with N=200)
- For each messageId not in DB -> fetch full message
- Parse headers + body
- Store

## UI Features

- Feed screen: either
  - - twitter/OG insta style
  - - reels style
  - - substack style
  - - or all three with a choice
- Sync button on feed screen
- Reader screen: render sanitized html
- Publisher Screen (group emails by sender)
- Search Screen (search by keyword matching and later semantic search)

# Tasks

- [x] project and repo set up + auth + db + vercel deploy
- [ ] finalize app features, api endpoints, db schema
- [ ] set up gmail api (permissions and all: for now only inbox access)
- [ ] trpc router: refer to notes on sync process
- [ ] seed db
- [ ] Design UI
- [ ] Make UI
