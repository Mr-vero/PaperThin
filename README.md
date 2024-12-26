# Paper Thin

A modern wallpaper discovery app built with Framework7. Features a beautiful interface for browsing, collecting, and downloading wallpapers from multiple sources.

## Features

- 🖼️ Browse wallpapers from multiple sources
- 📱 Progressive Web App (PWA) support
- 🌙 Dark mode support
- 💾 Save wallpapers to collections
- 🎲 Random wallpaper discovery
- 📱 Mobile-first responsive design
- ⚡ Fast loading with image optimization
- 🔍 Search functionality
- 📂 Category filtering

## Installation

First, install the dependencies:
```bash
npm install
```

For Capacitor builds, add the platforms:
```bash
npx cap add ios
npx cap add android
```

## Development

Start the development server:
```bash
npm run dev
```

## Building

Build the web app:
```bash
npm run build
```

Build for iOS:
```bash
npm run build-capacitor-ios
```

Build for Android:
```bash
npm run build-capacitor-android
```

## PWA Assets

Generate PWA assets (icons, splash screens):
```bash
framework7 assets
```

Or use the UI tool:
```bash
framework7 assets --ui
```

## Capacitor Assets

Generate mobile app assets:
```bash
npx cordova-res
```

## Technology Stack

- Framework7 - UI framework
- Vite - Build tool
- Capacitor - Native platform
- Workbox - Service worker and PWA support

## Documentation

- [Framework7 Core Documentation](https://framework7.io/docs/)
- [Capacitor Documentation](https://capacitorjs.com/docs)

## License

This project is licensed under the MIT License.