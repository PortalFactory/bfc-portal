<h1 align="center">Bumpkin Fight Club - Sunflower Land Portal</h1>

# 🎨 Sunnyside Assets

Sunflower Land uses crops, icons and tiles from Daniel Diggle's SunnySide Asset Pack.

These raw assets/tiles are not in this repo. You must purchase the asset pack if you wish to extend these assets or use them elsewhere.

[Download Here](https://danieldiggle.itch.io/sunnyside)

# 👶 Getting Started

Firstly, you will need to clone the repo locally. Once you have it ready navigate into the directory and run the following commands:

1. `npm install --global yarn` (if you don't have yarn installed)
2. `yarn install`
3. `cp .env.sample .env`
4. `yarn dev`

# Converting tileset into 'extruded'

`npx tile-extruder --tileWidth 16 --tileHeight 16 --input public/tileset.png --output public/tileset-extruded.png`

# 🧪 Testing

`yarn test`

This runs a range of business logic unit tests in the repo.

The plan is to use react testing library to test some of the core user interactions as well.

# ⚙️ Architecture

We use `xstate` to control the manage the user and session using a State Machine approach. This prevents our application from getting into invalid states and handles the use cases of switching accounts, networks, etc.

The primary states include:

- Connecting (connecting to MetaMask)
- Ready (Waiting for user input - Start)
- Signing (Sign a message to verify the account on the API)
- Authorising (Checking if a user has an account/farm)
- Unauthorised (when one of the above state transitions fails)
- Authorised (Play the game!)

# ⚙️ Vite

The app uses vite for bundling and development purposes. You can set build specific configuration in `vite.config.ts`

# 🌈 Tailwind

Tailwind is our CSS tool of choice. It enables us to:

- Use utility based classes
- Consistent theming (view `tailwind.config.js`)
- Perform CSS processing to minimize build sizes

# 🏷️ ERC1155 Metadata

Metadata is generated from markdown files.

Prerequisites:

`yarn global add ts-node`

To add new item:

1. Create `{SFT id}.md` file in `metadata\markdown` folder
2. Add `{SFT id}.png(gif)` file to `public\erc1155\images` folder
3. Run `yarn metadata`

# 🗃️ Directory Organization

- Assets: Images, Music, Branding and other Media
- Components: Reusable react components
- Lib: Utils, classes, machines and more.
- Features: Core domain concepts that have their own use cases/boundaries.
  Each feature (e.g. crops) has a similar nested structure of components, graphql & lib that are specific only to that feature.

# 🤝 Contributing Guidelines

👨‍💻 Developers - https://github.com/sunflower-land/sunflower-land/blob/main/docs/CONTRIBUTING.md

🧑‍🎨 Artists - https://github.com/sunflower-land/sunflower-land/blob/main/docs/ART_CONTRIBUTING.md

# ⚖️ No Licence

The previous version was used unethically on other Blockchains. The team is working on deciding the licence that will best suit our community. Until then, the code falls under No Licence and cannot be reused.

All media assets (images and music) are not available for use in commercial or private projects.

To access the crops, resources and land tiles, please refer to the [SunnySide Asset Pack](https://danieldiggle.itch.io/sunnyside)

If you wish to use Bumpkin NFTs or custom Sunflower Land collectibles in your own project please reach to the core team on Discord.
