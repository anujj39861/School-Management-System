# School Management System

A full-stack School Management System designed to streamline and digitize daily academic and administrative operations within educational institutions. The platform provides dedicated role-based dashboards for Administrators, Teachers, and Students, enabling efficient management of student records, attendance, classes, fee collection, and academic activities.

The system implements secure JWT-based authentication, role-based access control (RBAC), relational database management using MySQL, and RESTful APIs to ensure a scalable and secure school administration solution.

---

## Tech Stack

### Frontend
- Next.js
- React.js
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Authentication & Authorization
- JWT (JSON Web Tokens)
- Role-Based Access Control (RBAC)

---

## Features

### Admin Features

- Manage students, teachers, and classes
- Create and assign class schedules
- Monitor attendance records
- Manage fee collection and payment history
- View institution-wide reports and statistics
- Control user access and permissions
- Maintain student academic records

### Teacher Features

- View assigned classes
- Mark and update student attendance
- Access student information
- Manage classroom-related activities
- Track attendance reports
- View teaching schedules

### Student Features

- View personal profile information
- Access attendance records
- Check academic details
- View fee payment status
- Monitor class schedules
- Access institution announcements

---

## Authentication & Security

- JWT-based authentication
- Secure login system
- Role-based authorization
- Protected backend routes
- Middleware-based access control
- Session validation
- Restricted resource access based on user roles

---

## Attendance Management System

- Daily attendance tracking
- Attendance record management
- Class-wise attendance reports
- Student attendance history
- Teacher attendance operations
- Attendance analytics support

---

## Fee Management System

- Fee record management
- Payment history tracking
- Student fee status monitoring
- Fee reporting system
- Administrative fee management workflows

---

## System Architecture

### User Roles

#### Administrator

- Manage students
- Manage teachers
- Manage classes
- Monitor attendance
- Manage fees
- Generate reports
- Control system operations

#### Teacher

- Access assigned classes
- Mark attendance
- View student details
- Manage classroom activities

#### Student

- View attendance records
- Access profile information
- View fee details
- Check class information

---

## Technical Implementation

### Database Design

Designed a relational database schema for managing:

- Students
- Teachers
- Classes
- Attendance Records
- Fee Records
- User Roles

The database structure uses relationships and SQL joins to efficiently retrieve and manage academic data.

### REST API Development

Implemented RESTful APIs for:

- User management
- Student management
- Teacher management
- Attendance operations
- Fee management
- Reporting functionalities

Features include:

- Input validation
- Error handling
- Secure API communication
- Modular route architecture

### Authorization System

Implemented JWT-based authentication and middleware-based authorization to:

- Verify user identity
- Protect sensitive routes
- Restrict access based on roles
- Secure administrative operations

---

## Database Design

Core entities include:

- Users
- Students
- Teachers
- Classes
- Attendance
- Fee Records

Relationships:

```text
User
 ├── Assigned Role
 └── Authentication Access

Student
 ├── Belongs To Class
 ├── Has Attendance Records
 └── Has Fee Records

Teacher
 ├── Assigned Classes
 └── Manages Attendance

Class
 ├── Contains Students
 └── Assigned Teachers

Attendance
 └── Linked To Students

Fee Record
 └── Linked To Students
