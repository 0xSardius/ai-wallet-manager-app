# AI Wallet Manager

An AI-powered wallet management application built with Next.js and thirdweb AI API.

## Features

- 💬 Chat interface for interacting with your wallet using natural language
- 🤖 Powered by thirdweb AI API for Web3 operations
- 📱 Modern, responsive UI built with Tailwind CSS
- ⚡ Real-time streaming responses

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A thirdweb account and client ID

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory and add your thirdweb secret key:

```bash
THIRDWEB_SECRET_KEY=your_secret_key_here
```

You can get your secret key from the [thirdweb dashboard](https://thirdweb.com/dashboard). Use the secret key (not client ID) since this is a backend API route.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the chat interface.

## Usage

Simply type your questions or commands in the chat interface. The AI assistant can help you with:
- Wallet operations
- Transaction queries
- Token swaps
- Smart contract interactions
- And more Web3 operations

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **thirdweb AI API** - AI-powered Web3 interactions
- **Lucide React** - Icons

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
