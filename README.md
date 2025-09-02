# Timesheet Management System

A comprehensive full-stack timesheet management application built with modern technologies to streamline employee time tracking, approval workflows, and reporting.

## 🌟 Features

### Core Functionality
- **Employee Time Tracking**: Submit daily, weekly, and monthly timesheets
- **Approval Workflow**: Manager/HR approval system with status tracking
- **Real-time Notifications**: Live updates using SignalR for timesheet events
- **Report Generation**: Export timesheet data to PDF and Excel formats
- **Role-based Access Control**: Different permissions for System Admin, HR Admin, Manager, and Employee roles

### Advanced Features
- **Leave Management**: Holiday calendar and leave request system
- **Dashboard Analytics**: Visual reporting and productivity insights
- **Audit Trail**: Complete tracking of all timesheet actions
- **Mobile Responsive**: Optimized for desktop and mobile devices
- **Password Management**: Secure authentication with forced password changes

## 🚀 Technology Stack

### Backend
- **Framework**: ASP.NET Core Web API (.NET 9)
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT with refresh tokens using ASP.NET Identity
- **Real-time Communication**: SignalR Hub
- **PDF Generation**: QuestPDF
- **Excel Export**: ClosedXML

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: @tanstack/react-query
- **UI Components**: Custom component library with Radix UI
- **Icons**: Lucide React

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Environment Management**: DotNetEnv
- **API Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Docker](https://www.docker.com/get-started) (optional, for containerized deployment)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/timesheet-management-system.git
cd timesheet-management-system
```

### 2. Backend Setup

#### Environment Configuration
Create a `.env` file in the `Server` directory:

```env
# Database Configuration
ConnectionStrings__DefaultConnection=Host=localhost;Database=TimesheetDB;Username=your_username;Password=your_password

# JWT Configuration
Jwt__Key=your-super-secret-jwt-key-here-32-characters-minimum
Jwt__Issuer=TimesheetSystem
Jwt__Audience=TimesheetUsers
Jwt__ExpiryInMinutes=1440

# CORS Origins (comma-separated)
AllowedOrigins=http://localhost:5173,http://localhost:3000
```

#### Database Setup
```bash
cd Server/Server

# Install dependencies
dotnet restore

# Update database with migrations
dotnet ef database update

# Run the application
dotnet run
```

The API will be available at `https://localhost:5000` or `http://localhost:5000`

### 3. Frontend Setup

#### Environment Configuration
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

#### Install and Run
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Individual Container Setup
```bash
# Backend
cd Server
docker build -t timesheet-api .
docker run -p 5000:80 timesheet-api

# Frontend
cd client
docker build -t timesheet-client .
docker run -p 5173:80 timesheet-client
```

## 📚 API Documentation

Once the backend is running, access the Swagger documentation at:
- Development: `http://localhost:5000/swagger`

### Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/timesheets/my-timesheets` | Get current user's timesheets |
| POST | `/api/timesheets` | Create new timesheet |
| PUT | `/api/timesheets/{id}/approve` | Approve timesheet |
| GET | `/api/reports/employee/{id}/export` | Export employee reports |

## 👥 User Roles & Permissions

### System Administrator
- Full system access
- User management and configuration
- System logs and audit trail access

### HR Administrator
- View all timesheets and reports
- Leave management and holiday calendar
- User account management

### Manager
- Approve/reject team member timesheets
- Access team reports and analytics
- View team productivity metrics

### Employee
- Submit and edit personal timesheets
- View timesheet status and history
- Request leave and view holidays

## 🔧 Default Login Credentials

After database seeding, use these credentials:

**System Administrator**
- Email: `admin@timesheet.com`
- Password: `Admin@123`

*Note: You'll be prompted to change the password on first login.*

## 🧪 Testing

### Backend Tests
```bash
cd Server
dotnet test
```

### Frontend Tests
```bash
cd client
npm run test
```

## 🚀 Production Deployment

### Environment Variables
Ensure all production environment variables are properly configured:

```env
# Production Database
ConnectionStrings__DefaultConnection=your-production-db-connection

# Secure JWT Configuration
Jwt__Key=your-production-jwt-secret-key

# Production CORS Origins
AllowedOrigins=https://yourdomain.com,https://www.yourdomain.com
```

### Security Considerations
- Use strong JWT secrets (minimum 32 characters)
- Configure proper CORS origins for production
- Enable HTTPS in production
- Use environment-specific connection strings
- Implement proper logging and monitoring

## 📁 Project Structure

```
├── Server/                 # Backend ASP.NET Core API
│   ├── Controllers/        # API Controllers
│   ├── Models/            # Data models and DTOs
│   ├── Services/          # Business logic layer
│   ├── DataBase/          # EF Context and migrations
│   └── Hubs/              # SignalR hubs
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Route-specific pages
│   │   ├── services/      # API communication layer
│   │   └── lib/           # Utility functions
└── docker-compose.yml     # Multi-container orchestration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Issues

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/timesheet-management-system/issues) page
2. Create a new issue with detailed information
3. Include error messages, logs, and steps to reproduce

## 🎯 Roadmap

- [ ] Email notifications for timesheet events
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Integration with payroll systems
- [ ] Multi-language support
- [ ] Advanced leave management features

## 📞 Contact

**Project Maintainer**: Sandile Tshabalala
**Email**: your.email@example.com
**Project Link**: https://github.com/yourusername/timesheet-management-system

---

## 🙏 Acknowledgments

- [ASP.NET Core](https://docs.microsoft.com/aspnet/core) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [QuestPDF](https://www.questpdf.com/) - PDF generation
- [SignalR](https://docs.microsoft.com/aspnet/signalr/) - Real-time communication

---
*Built with ❤️ using modern web technologies*