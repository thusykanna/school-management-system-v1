<?php
require_once 'config.php';

// Check if user is authenticated
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper function to calculate letter grade
function calculateLetterGrade($marks) {
    if ($marks >= 75) return 'A';
    elseif ($marks >= 60) return 'B';
    elseif ($marks >= 40) return 'S';
    else return 'F';
}

try {
    $pdo = getDBConnection();
    
    switch ($method) {
        case 'GET':
            if ($action === 'student_subjects' && isset($_GET['student_id'])) {
                // Get subjects for a specific student (enrolled subjects)
                $stmt = $pdo->prepare("
                    SELECT s.id, s.subject_name, s.subject_code
                    FROM subjects s
                    JOIN enrollments e ON s.id = e.subject_id
                    WHERE e.student_id = ?
                    ORDER BY s.subject_name
                ");
                $stmt->execute([$_GET['student_id']]);
                $subjects = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'subjects' => $subjects]);
                
            } elseif ($action === 'summary') {
                // Get grade summary for all students
                $stmt = $pdo->query("
                    SELECT 
                        s.id as student_id,
                        s.student_id as student_number,
                        CONCAT(s.first_name, ' ', s.last_name) as student_name,
                        s.grade_level,
                        COUNT(DISTINCT m.subject_id) as subject_count,
                        AVG(m.marks) as average_marks
                    FROM students s
                    LEFT JOIN marks m ON s.id = m.student_id
                    GROUP BY s.id
                    ORDER BY average_marks DESC, s.first_name
                ");
                $summary = $stmt->fetchAll();
                
                // Add overall grade to each student
                foreach ($summary as &$student) {
                    if ($student['average_marks']) {
                        $student['overall_grade'] = calculateLetterGrade($student['average_marks']);
                    } else {
                        $student['overall_grade'] = null;
                    }
                }
                
                echo json_encode(['success' => true, 'summary' => $summary]);
                
            } elseif ($action === 'student_report' && isset($_GET['student_id'])) {
                // Get detailed report for a specific student
                $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
                $stmt->execute([$_GET['student_id']]);
                $student = $stmt->fetch();
                
                $stmt = $pdo->prepare("
                    SELECT m.*, s.subject_name, s.subject_code
                    FROM marks m
                    JOIN subjects s ON m.subject_id = s.id
                    WHERE m.student_id = ?
                    ORDER BY s.subject_name, m.exam_date DESC
                ");
                $stmt->execute([$_GET['student_id']]);
                $grades = $stmt->fetchAll();
                
                // Add letter grades
                foreach ($grades as &$grade) {
                    $grade['letter_grade'] = calculateLetterGrade($grade['marks']);
                }
                
                // Calculate statistics
                $stats = [];
                if (!empty($grades)) {
                    $marks = array_column($grades, 'marks');
                    $stats['total_subjects'] = count(array_unique(array_column($grades, 'subject_id')));
                    $stats['average_marks'] = array_sum($marks) / count($marks);
                    $stats['overall_grade'] = calculateLetterGrade($stats['average_marks']);
                    $stats['highest_mark'] = max($marks);
                    $stats['lowest_mark'] = min($marks);
                } else {
                    $stats['total_subjects'] = 0;
                    $stats['average_marks'] = null;
                    $stats['overall_grade'] = null;
                    $stats['highest_mark'] = null;
                    $stats['lowest_mark'] = null;
                }
                
                echo json_encode([
                    'success' => true, 
                    'student' => $student, 
                    'grades' => $grades,
                    'stats' => $stats
                ]);
                
            } else {
                // Get all grades with student and subject names
                $stmt = $pdo->query("
                    SELECT 
                        m.*,
                        CONCAT(s.first_name, ' ', s.last_name) as student_name,
                        s.student_id as student_number,
                        sub.subject_name,
                        sub.subject_code,
                        s.id as student_id,
                        sub.id as subject_id
                    FROM marks m
                    JOIN students s ON m.student_id = s.id
                    JOIN subjects sub ON m.subject_id = sub.id
                    ORDER BY m.created_at DESC
                ");
                $grades = $stmt->fetchAll();
                
                // Add letter grades
                foreach ($grades as &$grade) {
                    $grade['letter_grade'] = calculateLetterGrade($grade['marks']);
                }
                
                echo json_encode(['success' => true, 'grades' => $grades]);
            }
            break;
            
        case 'POST':
            if ($action === 'create') {
                // Create new marks entry
                $stmt = $pdo->prepare("
                    INSERT INTO marks (student_id, subject_id, marks, exam_type, exam_date)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $_POST['student_id'],
                    $_POST['subject_id'],
                    $_POST['marks'],
                    $_POST['exam_type'],
                    $_POST['exam_date']
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
                    $desc = "Marks added for $studentName in $subjectName ({$_POST['marks']} marks)";
                    $pdo->prepare("INSERT INTO activity_log (description) VALUES (?)")->execute([$desc]);
                    echo json_encode(['success' => true, 'message' => 'Marks saved successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to save marks']);
                }
                
            } elseif ($action === 'update' && isset($_GET['id'])) {
                // Update existing marks
                $stmt = $pdo->prepare("
                    UPDATE marks 
                    SET marks = ?, exam_type = ?, exam_date = ?
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $_POST['marks'],
                    $_POST['exam_type'],
                    $_POST['exam_date'],
                    $_GET['id']
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
                    $desc = "Marks updated for $studentName in $subjectName ({$_POST['marks']} marks)";
                    $pdo->prepare("INSERT INTO activity_log (description) VALUES (?)")->execute([$desc]);
                    echo json_encode(['success' => true, 'message' => 'Marks updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update marks']);
                }
            }
            break;
            
        case 'DELETE':
            if ($action === 'delete' && isset($_GET['id'])) {
                // Delete marks entry
                $stmt = $pdo->prepare("DELETE FROM marks WHERE id = ?");
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    // Log activity
                    $desc = "Marks deleted for marks ID {$_GET['id']}";
                    $pdo->prepare("INSERT INTO activity_log (description) VALUES (?)")->execute([$desc]);
                    echo json_encode(['success' => true, 'message' => 'Marks deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete marks']);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
