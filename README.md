# Sabong Arena Server (24/7 online for you + your cousin)

This tiny server does two things:
1. **Hosts your game** at its web address, so you both just open one link.
2. **Relays trades and duels** between two players who type the same room code.

No database, no accounts. Your farms still save on each phone.

## Deploy on Render (free, about 10 minutes)

1. Make a free account at https://github.com and create a new **private** repository.
   Upload everything in this folder (`server.js`, `package.json`, `render.yaml`, `public/index.html`).
2. Make a free account at https://render.com, then **New + > Web Service**, connect the GitHub repo.
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: **Free**
3. Wait for the deploy to finish. Render gives you an address like `https://sabong-arena-xxxx.onrender.com`.
4. Open `https://YOUR-ADDRESS/health`. You should see `{"ok":true,...}`.

## Keep it awake 24/7 (important on the free plan)

Render's free plan puts the server to sleep after about 15 minutes with no traffic.
The first connection after sleep takes up to a minute to wake it.
To avoid that, use a free pinger:

1. Sign up at https://uptimerobot.com (free).
2. Add a monitor: type **HTTP(s)**, URL `https://YOUR-ADDRESS/health`, interval **5 minutes**.

The server then never sleeps. (Render can still restart a free service now and then, so
if you get disconnected, just tap Connect again.) Check Render's current free-plan limits
on their pricing page; if you want zero hassle, their paid starter plan is always-on.

## Playing

1. Both of you open `https://YOUR-ADDRESS` on your phones (add to home screen if you like).
2. Go to **Trade & Duel**, choose **🌐 Online**.
3. Both type the **same room code** (for example `IGON24`) and tap **Connect**.
4. When both are in, you will see "Linked", then trade birds or duel.

Tip: pick one fixed room code and always reuse it. It is remembered on each phone.
Rooms hold exactly 2 players, so nobody can barge in once you are both connected.

## If you open the game from a saved .html file instead

Open **Trade & Duel > Online > ⚙️ Server**, paste your server address, tap Save, then Test.

## Other ways to host (same files, any host with Node 18+)

- **Fly.io / Railway / Koyeb**: deploy the folder; set the start command to `npm start`.
- **Old Android phone or PC at home**: install Node, run `npm install && npm start`,
  then expose it with a free Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`)
  to get a public https address.

## Run it on your own computer to test

    npm install
    npm start
    # open http://localhost:3000 in two browser tabs, same room code
