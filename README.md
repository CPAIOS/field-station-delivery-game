# Field Station Farms - Meteor Delivery Challenge

A fun arcade game created for Field Station Farms to share on social media!

## How to Play Locally

1. You need a local web server to run this game (browsers block Three.js imports from `file://`)

2. If you have Python installed:
   ```bash
   cd field-station-delivery-game
   python3 -m http.server 8000
   ```

3. If you have Node.js installed:
   ```bash
   cd field-station-delivery-game
   npx serve
   ```

4. Open your browser to `http://localhost:8000` (or whatever port the server shows)

## Controls

- **Arrow Keys** or **WASD** to steer the truck left and right
- Avoid meteors hitting your trees
- Drive through puddles to put out fires
- Deliver as many trees as possible!

## Game Mechanics

- Start with 12 trees on your flatbed
- Earn $50 per tree delivered
- Bonus $200 for perfect delivery (all 12 trees)
- Trees catch fire when hit by meteors
- Fire can spread to nearby trees
- Puddles extinguish burning trees
- Game ends after 500m or when all trees are lost

## Deployment

To deploy this game:
1. Upload all files to any web host (Netlify, Vercel, GitHub Pages, etc.)
2. No build process needed - it's pure HTML/JS
3. Share the link on social media!

---

Created with ❤️ for Field Station Farms
Richmond, VA | (804) 304-4716 | fieldstationfarms.com
