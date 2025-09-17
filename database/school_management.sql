-- School Management System Database Schema
-- Created for XAMPP/MySQL environment

CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Teachers table for authentication
CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    date_of_birth DATE,
    grade_level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_code VARCHAR(10) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student-Subject enrollment table
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    subject_id INT,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, subject_id)
);

-- Marks table
CREATE TABLE marks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    subject_id INT,
    marks DECIMAL(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
    exam_type VARCHAR(50) DEFAULT 'Regular',
    exam_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Insert default teacher account
INSERT INTO teachers (username, password, full_name, email) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin@school.com');
-- Default password is 'password' (hashed)

-- Insert sample subjects
INSERT INTO subjects (subject_code, subject_name, description, credits) VALUES
('MATH101', 'Mathematics', 'Basic Mathematics', 3),
('ENG101', 'English', 'English Language and Literature', 3),
('SCI101', 'Science', 'General Science', 3),
('HIST101', 'History', 'World History', 2),
('ART101', 'Art', 'Creative Arts', 2);

-- Insert sample students
INSERT INTO students (student_id, first_name, last_name, email, phone, grade_level) VALUES
('STU001', 'John', 'Doe', 'john.doe@email.com', '123-456-7890', 10),
('STU002', 'Jane', 'Smith', 'jane.smith@email.com', '123-456-7891', 10),
('STU003', 'Mike', 'Johnson', 'mike.johnson@email.com', '123-456-7892', 11),
('STU004', 'Sarah', 'Williams', 'sarah.williams@email.com', '123-456-7893', 11),
('STU005', 'David', 'Brown', 'david.brown@email.com', '123-456-7894', 12);
