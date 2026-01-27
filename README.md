# Daily Task Planner

A production-ready daily task planner built with Next.js 16, featuring local-first SQLite storage, real-time search, and a polished split-view UI with dark/light theme support.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC)](https://tailwindcss.com/)
[![React Query](https://img.shields.io/badge/React%20Query-5-FF4154)](https://tanstack.com/query)
[![Tests](https://img.shields.io/badge/Tests-272%20passing-brightgreen)](./package.json)
[![Coverage](https://img.shields.io/badge/Coverage-74.94%25-yellow)](./package.json)

## ✨ Features

### Core Task Management
- ✅ **Create, edit, and delete tasks** with rich metadata
- 📅 **Due dates & deadlines** with calendar integration
- ⏰ **Time tracking** with estimates and actual time spent
- 🔁 **Recurring tasks** with flexible scheduling rules
- 🏷️ **Labels & tags** for organization
- 📋 **Subtasks** for breaking down complex tasks
- 📎 **File attachments** support

### Views & Organization
- 📆 **Today view** - Focus on what's due today
- 📊 **Next 7 days** - Weekly planning
- 📈 **Upcoming** - All scheduled tasks
- 📑 **All tasks** - Complete task inventory
- ✅ **Completed** - Task history
- 📁 **Custom lists** - Organize tasks your way
- 🏷️ **Label filtering** - Filter by multiple labels

### User Experience
- 🌓 **Dark/light mode** with system preference detection
- 🔍 **Real-time search** with fuzzy matching
- ⌨️ **Keyboard shortcuts** for power users
- 📱 **Responsive design** - Mobile, tablet, and desktop
- 💨 **Fast performance** with React Query caching
- 🔄 **Optimistic updates** for instant feedback
- 📊 **Activity tracking** - View task history

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [SQLite](https://sqlite.org/) (via better-sqlite3/bun:sqlite) |
| **State Management** | [React Query (TanStack Query)](https://tanstack.com/query) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Search** | [Fuse.js](https://fusejs.io/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Date Handling** | [date-fns](https://date-fns.org/) |
| **Forms** | [Zod](https://zod.dev/) for validation |

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ or [Bun](https://bun.sh/) 1.0+
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd daily-task-planner

# Install dependencies
npm install
# or
bun install

# Set up environment (optional)
cp .env.example .env

# Start the development server
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` / `bun dev` | Start development server with hot reload |
| `npm run build` / `bun run build` | Create production build |
| `npm run start` / `bun start` | Start production server |
| `npm run lint` / `bun lint` | Run ESLint |
| `npm test` / `bun test` | Run all tests |
| `npm run test:watch` / `bun test --watch` | Run tests in watch mode |
| `npm run test:coverage` / `bun test --coverage` | Run tests with coverage report |

## 📁 Project Structure

```
daily-task-planner/
├── app/                          # Next.js App Router
│   ├── api/                      # RESTful API routes
│   │   ├── activity/             # Activity log endpoints
│   │   ├── attachments/          # File attachment endpoints
│   │   ├── labels/               # Label CRUD endpoints
│   │   ├── lists/                # List CRUD endpoints
│   │   ├── search/               # Search endpoint
│   │   ├── subtasks/             # Subtask endpoints
│   │   └── tasks/                # Task CRUD endpoints
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Main application page
│   └── globals.css               # Global styles & Tailwind
│
├── components/                   # React components
│   ├── forms/                    # Form components (DatePicker, etc.)
│   ├── layout/                   # Layout components (Sidebar, Header)
│   ├── lists/                    # List-related dialogs
│   ├── providers/                # Context providers
│   ├── search/                   # Search components
│   ├── tasks/                    # Task display components
│   └── ui/                       # shadcn/ui base components
│
├── hooks/                        # Custom React Query hooks
│   ├── useActivity.ts            # Activity log hooks
│   ├── useLabels.ts              # Label data hooks
│   ├── useLists.ts               # List data hooks
│   ├── useSearch.ts              # Search hooks
│   ├── useSubtasks.ts            # Subtask hooks
│   ├── useTaskFilters.ts         # Filter logic hooks
│   └── useTasks.ts               # Task data hooks
│
├── lib/                          # Utility libraries
│   ├── db/                       # Database layer
│   │   ├── index.ts              # Database connection
│   │   ├── migrations.ts         # Schema migrations
│   │   └── repositories/         # Data access layer
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── validation/               # Zod validation schemas
│
├── data/                         # SQLite database files
├── docs/                         # Documentation
│   ├── TECH_SPEC.md              # Technical specification
│   └── DATABASE_SCHEMA.sql       # Database schema
└── public/                       # Static assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to SQLite database file | `./data/app.db` |
| `NODE_ENV` | Environment mode | `development` |

### Database

The application uses SQLite with automatic migrations. The database file is created automatically on first run in the `data/` directory.

To reset the database:

```typescript
// In browser console or API route
import { resetDatabase } from '@/lib/db/migrations';
resetDatabase();
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Open search |
| `⌘/Ctrl + N` | Create new task |
| `⌘/Ctrl + B` | Toggle sidebar |
| `Esc` | Close modal/dialog |
| `Enter` | Submit form |

## 🧪 Testing

The project includes comprehensive tests:

- **Unit Tests** - Individual functions and utilities
- **Integration Tests** - API route testing
- **Database Tests** - Repository layer testing
- **E2E Tests** - User flow testing

### Test Coverage Areas

- Database operations (CRUD, transactions)
- API endpoints (validation, error handling)
- Repository pattern implementation
- Utility functions (date handling, formatting)

Run tests with coverage:

```bash
bun test --coverage
```

## 📱 Screenshots

> Screenshots will be added here showing:
> - Main task list view with sidebar
> - Task detail panel
> - Dark mode interface
> - Search functionality
> - Mobile responsive design

## 🎨 Customization

### Themes

The application supports both light and dark modes. Toggle in the header or set system preference.

### Custom Lists

Create custom lists with:
- Custom colors
- Emoji icons
- Sort ordering

### Labels

Organize with labels featuring:
- Custom colors
- Icon selection
- Multi-select filtering

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
# Dockerfile example
FROM oven/bun:latest

WORKDIR /app
COPY . .

RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

### Self-Hosted

```bash
# Build
bun run build

# Start production server
bun run start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun test`)
5. Run linting (`bun run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- TypeScript with strict mode enabled
- ESLint for code linting
- Consistent barrel exports for clean imports
- JSDoc comments for public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Next.js](https://nextjs.org/) team for the amazing framework
- [TanStack Query](https://tanstack.com/query) for powerful data synchronization

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Technical Specification](./docs/TECH_SPEC.md)
2. Review the [Database Schema](./docs/DATABASE_SCHEMA.sql)
3. Open an issue on GitHub

---

**Built with ❤️ for productive days ahead!**
