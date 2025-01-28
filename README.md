# ethra1n

An alternative frontend for [Burner](https://burner.pro) hardware wallets

still in early development, moreso prototyping around viem+burner


## running it

`bun run dev --host` (`--host` exposes it to other devices on your local network)

if you want to use this with your phone, you'll need to access it over `https` in order for your phone to let you use nfc signing (on ios at least), or on localhost (according to some stuff I read but didn't try)

there are a few ways to do this:

### Actually deploy it to some url

buy a domain name and get an ssl cert and host it there. maybe I'll do this when the whole thing is more complete

### ask an AI

this is how I got my solution, but it will let you tailor yours to your needs.

basically ask it: "I have a web app running on my computer on port 5173. I want to access this site over https from my mobile phone. how do I set this up" and follow its instructions.

### use tailscale (this is what I do)

tailscale makes it really easy to network your devices together and its free.

#### get ssl cert

`sudo tailscale cert <your-url>` (you can find it in the tailscale dashboard)

#### nginx site

I run this on my laptop with `bun run dev --host`, which brings it up on port 5173. Then I have the following nginx site config.

this lets you expose port 443 and route traffic from it to the web app you're running on port 5173.


``` nginx
server {
    listen 443 ssl;
    server_name xps.jackal-betta.ts.net;  # Replace with your Tailscale hostname

    ssl_certificate /etc/nginx/ssl/xps.jackal-betta.ts.net.crt;
    ssl_certificate_key /etc/nginx/ssl/xps.jackal-betta.ts.net.key;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Optional: Redirect HTTP to HTTPS
server {
    listen 80;
    server_name xps.jackal-betta.ts.net;
    return 301 https://$server_name$request_uri;
}
```

#### open url in browser

then I can just go tp xps.jackal-betta.ts.net in my browser and it works

this url will only be exposed to devices that are connected to your tailscale vpn, its not exposed to the world.
