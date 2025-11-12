# 🚀 FEY Protocol Staking Interface

A cyberpunk-themed Farcaster miniapp for staking FEY tokens and earning protocol fees through the xFeyVault on Base network.

![FEY Protocol Staking](https://feystaking.orbiter.website/image.png)

## 🌟 Overview

The FEY Protocol Staking Interface allows users to:

- **Stake FEY tokens** and receive xFEY shares representing vault ownership
- **Earn protocol fees** from all tokens launched through FEY Protocol (20% of trading fees)
- **Unstake anytime** to receive FEY + accumulated rewards

## 🏗️ Architecture

### Smart Contracts (Base Network)

| Contract         | Address                                      | Purpose                       |
| ---------------- | -------------------------------------------- | ----------------------------- |
| **FEY Token**    | `0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D` | ERC20 token for staking       |
| **xFeyVault**    | `0x72f5565Ab147105614ca4Eb83ecF15f751Fd8C50` | ERC4626 staking vault         |
| **Factory**      | `0x5B409184204b86f708d3aeBb3cad3F02835f68cC` | Protocol factory (fee source) |
| **FeyFeeLocker** | `0xf739FC4094F3Df0a1Be08E2925b609F3C3Aa13c6` | Temporary fee storage         |

### How Staking Works

1. **Staking (FEY → xFEY)**:

   - User approves xFeyVault to spend FEY tokens
   - User calls `deposit(assets, receiver)` on vault
   - Vault mints xFEY shares proportional to deposit
   - User earns from protocol fees automatically

2. **Unstaking (xFEY → FEY)**:
   - User calls `redeem(shares, receiver, owner)` on vault
   - Vault burns xFEY shares and returns proportional FEY
   - User receives original stake + accumulated rewards

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with cyberpunk theme
- **Blockchain**: Wagmi + Viem for Base network
- **Farcaster**: Miniapp SDK for native integration
- **State**: React Query for data management

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.11.0 or higher ([Download](https://nodejs.org/))
- **Git** for version control
- **A Farcaster account** for testing

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fey-staking-miniapp

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Development Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run type-check # Check TypeScript types
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── LoadingSpinner.tsx   # Cyberpunk loading spinner
│   ├── WalletConnect.tsx    # Wallet connection UI
│   ├── StakeFlow.tsx        # Complete staking flow
│   └── UnstakeFlow.tsx      # Complete unstaking flow
├── config/             # Configuration files
│   ├── contracts.ts        # Contract addresses & ABIs
│   └── wagmi.ts           # Wagmi configuration
├── hooks/              # Custom React hooks
│   └── useFeyProtocol.ts   # Protocol interaction hooks
├── utils/              # Utility functions
│   └── formatting.ts       # Number/currency formatting
├── App.tsx             # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles with cyberpunk theme

public/
├── .well-known/
│   └── farcaster.json     # Farcaster manifest
├── icon.png              # App icon
├── image.png            # Embed image
└── splash.png           # Splash screen
```

## 🎨 Design System

The interface uses a cyberpunk terminal aesthetic:

- **Colors**: Neon green (#00ff41) on black (#000000)
- **Typography**: Monospace fonts (Courier New)
- **Effects**: Glowing borders, grid backgrounds, scanlines
- **Animations**: Smooth transitions, loading spinners

### Cyberpunk Theme Variables

```css
:root {
  --neon-green: #00ff41;
  --neon-green-dim: #22c55e;
  --terminal-bg: #000000;
  --glow-sm: 0 0 5px var(--neon-green);
  --glow-lg: 0 0 10px var(--neon-green), 0 0 20px var(--neon-green);
}
```

## 🔧 Configuration

### Environment Setup

No environment variables are required for basic functionality. All contract addresses and RPC endpoints are configured in the codebase.

### Contract Configuration

Update contract addresses in `src/config/contracts.ts`:

```typescript
// Base Network (Chain ID: 8453)
export const FEY_TOKEN_ADDRESS = "0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D";
export const XFEY_VAULT_ADDRESS = "0x72f5565Ab147105614ca4Eb83ecF15f751Fd8C50";
```

### Farcaster Manifest

The manifest is located at `public/.well-known/farcaster.json` and includes:

- App metadata (name, description, icons)
- Required blockchain capabilities
- Account association for verification

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Wallet Connection**: Connect via Farcaster miniapp connector
- [ ] **Balance Display**: View FEY and xFEY balances correctly
- [ ] **Stake Flow**: Complete approval + deposit transaction
- [ ] **Unstake Flow**: Complete redeem transaction
- [ ] **Error Handling**: Test insufficient balances, rejected transactions
- [ ] **Loading States**: Verify all loading indicators work
- [ ] **Mobile Support**: Test on mobile Farcaster clients

### Testing in Farcaster

1. **Deploy to test environment** (or use ngrok for local testing)
2. **Use the Farcaster preview tool**: `https://farcaster.xyz/~/developers/mini-apps/preview`
3. **Test the miniapp embed** in a cast
4. **Verify manifest**: Check `/.well-known/farcaster.json` loads correctly

## 📱 Deployment

### Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run preview
```

### Deploy to Hosting

The app can be deployed to any static hosting provider:

**Popular Options:**

- **Vercel**: `npm i -g vercel && vercel`
- **Netlify**: Drag `dist` folder to Netlify
- **GitHub Pages**: Enable in repo settings

**Requirements:**

- Serve `/.well-known/farcaster.json` correctly
- HTTPS enabled (required by Farcaster)
- Proper MIME types for all files

### Domain Setup

1. **Update manifest**: Replace `https://your-domain.com` with actual domain
2. **Update HTML meta tags**: Update embed URLs in `index.html`
3. **Verify manifest**: Ensure `/.well-known/farcaster.json` is accessible
4. **Register with Farcaster**: Use the Farcaster developer tools

## 🔐 Security

### Smart Contract Security

- **Audited Contracts**: Uses standard ERC20 and ERC4626 implementations
- **No Custom Logic**: Minimal custom code reduces attack surface

### Frontend Security

- **Input Validation**: All user inputs are validated and sanitized
- **Transaction Safety**: Users must confirm all transactions
- **Error Handling**: Graceful handling of all error conditions
- **No Private Keys**: Wallet integration via Farcaster connector

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes**: Follow the coding standards below
4. **Test thoroughly**: Ensure all functionality works
5. **Submit a pull request**: Include description of changes

### Coding Standards

- **TypeScript**: Use strict type checking
- **Comments**: Document all functions and complex logic
- **Formatting**: Use consistent indentation and naming
- **Error Handling**: Always handle errors gracefully
- **Performance**: Optimize for mobile devices

### Adding New Features

When adding features:

1. **Update type definitions** in hooks and components
2. **Add loading states** for all async operations
3. **Include error handling** for all failure cases
4. **Test on multiple devices** including mobile
5. **Update documentation** as needed

## 📚 Resources

### FEY Protocol

- **Contract Explorer**: [Base Scan](https://basescan.org)
- **Protocol Docs**: [FEY Protocol Documentation](https://fey.money)
- **Community**: [FEY Discord/Telegram](https://discord.gg/xdDT9nGX)

### Farcaster Development

- **Miniapp Docs**: [https://docs.farcaster.xyz/developers/miniapps](https://docs.farcaster.xyz/developers/miniapps)
- **SDK Reference**: [Farcaster SDK](https://github.com/farcasterxyz/miniapps)
- **Developer Portal**: [https://warpcast.com/~/developers](https://warpcast.com/~/developers)

### Technical Documentation

- **Wagmi**: [https://wagmi.sh](https://wagmi.sh)
- **Viem**: [https://viem.sh](https://viem.sh)
- **ERC4626**: [EIP-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- **Base Network**: [https://base.org](https://base.org)

## 🐛 Troubleshooting

### Common Issues

**"Wallet not connecting"**

- Ensure you're using a Farcaster client with wallet support
- Try refreshing the miniapp
- Check that Base network is supported

**"Transaction failing"**

- Verify sufficient FEY balance for staking
- Check that you have enough ETH for gas fees
- Ensure proper approval before staking

**"Balances not updating"**

- Wait for transaction confirmation (2-3 blocks on Base)
- Refresh the app if balances seem stuck
- Check transaction on [Base Scan](https://basescan.org)

**"App not loading"**

- Check browser console for errors
- Ensure all dependencies are installed: `npm install`
- Verify Node.js version is 22.11.0+

### Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Community Discord**: Join for development discussions
- **Documentation**: Check Farcaster and FEY Protocol docs

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **FEY Protocol Team** for creating the protocol. [@wiz](https://farcaster.xyz/wiz) and [@atareh](https://farcaster.xyz/atareh)

---

**Built with ❤️ for the Farcaster ecosystem**

_FEY: CREATE. BUILD. OWN_
