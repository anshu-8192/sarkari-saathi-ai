# Sarkari Saathi AI — Deploy Guide (bina coding ke)

Ye folder ek **complete website + secure backend** hai. Ab aapki Gemini API key
kahin bhi browser mein nahi jaati — sirf server par (environment variable ke
roop mein) rehti hai. Isiliye ye version **public launch ke liye safe** hai.

## Sabse aasan tareeka: Render.com par deploy karo (free, koi coding nahi)

1. **GitHub account banao** (agar nahi hai) — github.com par free sign up.
2. Is poore folder (`sarkari-saathi-ai`) ko ek naye GitHub repository mein
   upload kar do. (GitHub website par "Add file → Upload files" se seedha
   drag-drop kar sakte ho, terminal ki zaroorat nahi.)
3. **render.com** par jao, free account banao, aur GitHub se sign in karo.
4. Dashboard mein **"New +" → "Web Service"** par click karo.
5. Apni GitHub repo select karo.
6. Ye settings bharo:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
7. **Environment Variable** add karo (bahut zaroori step):
   - Key: `GEMINI_API_KEY`
   - Value: apni Gemini key (free key yahan se banao: aistudio.google.com/apikey)
8. **"Create Web Service"** dabao. 2-3 minute mein deploy ho jayega.
9. Render aapko ek link dega jaise `https://sarkari-saathi-ai.onrender.com` —
   yahi aapki live public website hai! Ye link kisi ko bhi bhej sakte ho.

Render ka free plan thoda slow start hota hai agar site kaafi der tak use na ho
(pehla request 30-50 second le sakta hai) — chalu rehta hai warna sab normal.

## Alternative: Railway.app ya Vercel

Agar Render pasand na aaye, wahi steps (GitHub repo → environment variable
`GEMINI_API_KEY` set karo → deploy) Railway.app ya Vercel par bhi kaam karte
hain. Sabka free tier hai.

## Apne computer par test karna (optional)

Agar kisi se coding help lekar local par check karana ho:

```
npm install
GEMINI_API_KEY=apni_key_yaha_daalo npm start
```

Fir browser mein `http://localhost:3000` kholo.

## Is folder mein kya hai

- `server.js` — backend server jo AI calls ko secure tarike se handle karta hai
- `rate-limit.js` — spam/misuse rokne ke liye chhota sa limiter (max 20 chat/10 min per user)
- `public/index.html` — poori website (frontend)
- `public/data/schemes.json` — sabhi schemes ka data (yahan se naye schemes add/edit kar sakte ho)
- `package.json` — dependencies ki list

## Naye schemes add karne hain?

`public/data/schemes.json` file kholo, usi format mein ek naya entry jod do,
aur file save karke wapas GitHub par upload kar do — Render khud-ba-khud
naya version deploy kar dega.

## Safety note

- API key sirf server ke environment variable mein rehti hai — kabhi bhi GitHub
  par `.env` file upload MAT karo (agar banao to).
- Rate limiter lagाया hai taaki koi ek user bahut saari fake requests bhejkar
  aapka Gemini quota khatam na kar de. Zaroorat lage to `server.js` mein
  `rate-limit` wali line se limit badal/ghata sakte ho.
