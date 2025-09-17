<?php
require_once 'config.php';

// Check if user is authenticated
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $pdo = getDBConnection();
    
    switch ($method) {
        case 'GET':
            if ($action === 'enrollments' && isset($_GET['id'])) {
                // Get subject enrollments
                $stmt = $pdo->prepare("
                    SELECT s.*, sub.subject_name, sub.subject_code
                    FROM subjects sub
                    WHERE sub.id = ?
                ");
                $stmt->execute([$_GET['id']]);
                $subject = $stmt->fetch();
                
                $stmt = $pdo->prepare("
                    SELECT e.id as enrollment_id, s.*, e.enrollment_date
                    FROM enrollments e
                    JOIN students s ON e.student_id = s.id
                    WHERE e.subject_id = ?
                    ORDER BY s.first_name, s.last_name
                ");
                $stmt->execute([$_GET['id']]);
                $enrollments = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true, 
                    'subject' => $subject, 
                    'enrollments' => $enrollments
                ]);
            } else {
                // Get all subjects with enrollment counts
                $stmt = $pdo->query("
                    SELECT s.*, COUNT(e.id) as enrolled_count
                    FROM subjects s
                    LEFT JOIN enrollments e ON s.id = e.subject_id
                    GROUP BY s.id
                    ORDER BY s.subject_name
                ");
                $subjects = $stmt->fetchAll();
                echo json_encode(['success' => true, 'subjects' => $subjects]);
            }
            break;
            
        case 'POST':
            if ($action === 'create') {
                // Create new subject
                $stmt = $pdo->prepare("
                    INSERT INTO subjects (subject_code, subject_name, description, credits)
                    VALUES (?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $_POST['subject_code'],
                    $_POST['subject_name'],
                    $_POST['description'] ?: null,
                    $_POST['credits']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Subject created successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create subject']);
                }
                
            } elseif ($action === 'update' && isset($_GET['id'])) {
                // Update existing subject
                $stmt = $pdo->prepare("
                    UPDATE subjects 
                    SET subject_code = ?, subject_name = ?, description = ?, credits = ?
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $_POST['subject_code'],
                    $_POST['subject_name'],
                    $_POST['description'] ?: null,
                    $_POST['credits'],
                    $_GET['id']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Subject updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update subject']);
                }
                
            } elseif ($action === 'enroll') {
                // Enroll student to subject
                $stmt = $pdo->prepare("
                    INSERT INTO enrollments (student_id, subject_id)
                    VALUES (?, ?)
                ");
                
                $result = $stmt->execute([
                    $_POST['student_id'],
                    $_POST['subject_id']
                ]);
                
                if ($result) {
                    // Log activity with names
                    $studentName = '';
                    $subjectName = '';
                    $stmtStudent = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM students WHERE id = ?");
                    $stmtStudent->execute([$_POST['student_id']]);
                    if ($row = $stmtStudent->fetch()) $studentName = $row['name'];
                    $stmtSubject = $pdo->prepare("SELECT subject_name FROM subjects WHERE id = ?");
                    $stmtSubject->execute([$_POST['subject_id']]);
                    if ($row = $stmtSubject->fetch()) $subjectName = $row['subject_name'];
                    $desc = "$studentName enrolled in $subjectName";
                    $pdo->prepare("INSERT INTO activity_log (description) VALUES (?)")->execute([$desc]);
                    echo json_encode(['success' => true, 'message' => 'Student enrolled successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to enroll student']);
                }
            }
            break;
            
        case 'DELETE':
            if ($action === 'delete' && isset($_GET['id'])) {
                // Delete subject (cascading deletes will handle enrollments and marks)
                $stmt = $pdo->prepare("DELETE FROM subjects WHERE id = ?");
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Subject deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete subject']);
                }
                
            } elseif ($action === 'unenroll' && isset($_GET['id'])) {
                // Remove student from subject
                $stmt = $pdo->prepare("DELETE FROM enrollments WHERE id = ?");
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Student removed from subject successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to remove student']);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        if (strpos($e->getMessage(), 'subject_code') !== false) {
            echo json_encode(['success' => false, 'message' => 'Subject code already exists']);
        } elseif (strpos($e->getMessage(), 'unique_enrollment') !== false) {
            echo json_encode(['success' => false, 'message' => 'Student is already enrolled in this subject']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Duplicate entry error']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
