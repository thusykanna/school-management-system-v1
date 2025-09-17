<?php
require_once 'config.php';

// Check if user is authenticated
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

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
    
    switch ($action) {
        case 'overall_stats':
            // Get overall school statistics
            $stats = [];
            
            // Total students
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
            $stats['total_students'] = $stmt->fetch()['count'];
            
            // Total subjects
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM subjects");
            $stats['total_subjects'] = $stmt->fetch()['count'];
            
            // Overall average
            $stmt = $pdo->query("SELECT AVG(marks) as avg FROM marks");
            $stats['overall_average'] = $stmt->fetch()['avg'];
            
            // A grade students count
            $stmt = $pdo->query("
                SELECT COUNT(DISTINCT student_id) as count 
                FROM (
                    SELECT student_id, AVG(marks) as avg_marks
                    FROM marks 
                    GROUP BY student_id
                    HAVING avg_marks >= 75
                ) as a_students
            ");
            $stats['a_grade_students'] = $stmt->fetch()['count'];
            
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        case 'rankings':
            // Get student rankings based on average marks
            $stmt = $pdo->query("
                SELECT 
                    s.id as student_id,
                    s.student_id as student_number,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.grade_level,
                    COUNT(m.id) as subject_count,
                    SUM(m.marks) as total_marks,
                    AVG(m.marks) as average_marks
                FROM students s
                LEFT JOIN marks m ON s.id = m.student_id
                GROUP BY s.id
                HAVING subject_count > 0
                ORDER BY average_marks DESC, total_marks DESC
            ");
            $rankings = $stmt->fetchAll();
            
            // Add overall grade to each student
            foreach ($rankings as &$student) {
                if ($student['average_marks']) {
                    $student['overall_grade'] = calculateLetterGrade($student['average_marks']);
                } else {
                    $student['overall_grade'] = null;
                }
            }
            
            echo json_encode(['success' => true, 'rankings' => $rankings]);
            break;
            
        case 'subject_analysis':
            // Get performance analysis by subject
            $stmt = $pdo->query("
                SELECT 
                    sub.subject_name,
                    sub.subject_code,
                    COUNT(m.id) as student_count,
                    AVG(m.marks) as average_marks,
                    MAX(m.marks) as highest_mark,
                    MIN(m.marks) as lowest_mark,
                    SUM(CASE WHEN m.marks >= 75 THEN 1 ELSE 0 END) as a_grades,
                    (SUM(CASE WHEN m.marks >= 40 THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id)) as pass_rate
                FROM subjects sub
                LEFT JOIN marks m ON sub.id = m.subject_id
                GROUP BY sub.id
                HAVING student_count > 0
                ORDER BY average_marks DESC
            ");
            $analysis = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'analysis' => $analysis]);
            break;
            
        case 'grade_distribution':
            // Get grade distribution across all marks
            $stmt = $pdo->query("
                SELECT 
                    SUM(CASE WHEN marks >= 75 THEN 1 ELSE 0 END) as A,
                    SUM(CASE WHEN marks >= 60 AND marks < 75 THEN 1 ELSE 0 END) as B,
                    SUM(CASE WHEN marks >= 40 AND marks < 60 THEN 1 ELSE 0 END) as S,
                    SUM(CASE WHEN marks < 40 THEN 1 ELSE 0 END) as F
                FROM marks
            ");
            $distribution = $stmt->fetch();
            
            echo json_encode(['success' => true, 'distribution' => $distribution]);
            break;
            
        case 'class_performance':
            // Get performance by grade level
            $stmt = $pdo->query("
                SELECT 
                    s.grade_level,
                    COUNT(DISTINCT s.id) as student_count,
                    AVG(student_avg.avg_marks) as class_average,
                    MAX(student_avg.avg_marks) as highest_average,
                    MIN(student_avg.avg_marks) as lowest_average,
                    (SELECT CONCAT(s2.first_name, ' ', s2.last_name) 
                     FROM students s2 
                     JOIN (SELECT student_id, AVG(marks) as avg FROM marks GROUP BY student_id) top_avg 
                     ON s2.id = top_avg.student_id 
                     WHERE s2.grade_level = s.grade_level 
                     ORDER BY top_avg.avg DESC LIMIT 1) as top_student
                FROM students s
                LEFT JOIN (
                    SELECT student_id, AVG(marks) as avg_marks
                    FROM marks
                    GROUP BY student_id
                ) student_avg ON s.id = student_avg.student_id
                WHERE student_avg.avg_marks IS NOT NULL
                GROUP BY s.grade_level
                ORDER BY s.grade_level
            ");
            $performance = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'performance' => $performance]);
            break;
            
        case 'insights':
            // Generate performance insights
            $insights = [];
            
            // Get top performing subject
            $stmt = $pdo->query("
                SELECT sub.subject_name, AVG(m.marks) as avg_marks
                FROM subjects sub
                JOIN marks m ON sub.id = m.subject_id
                GROUP BY sub.id
                ORDER BY avg_marks DESC
                LIMIT 1
            ");
            $topSubject = $stmt->fetch();
            if ($topSubject) {
                $insights[] = "Highest performing subject: {$topSubject['subject_name']} with average of " . number_format($topSubject['avg_marks'], 1);
            }
            
            // Get improvement needed subject
            $stmt = $pdo->query("
                SELECT sub.subject_name, AVG(m.marks) as avg_marks
                FROM subjects sub
                JOIN marks m ON sub.id = m.subject_id
                GROUP BY sub.id
                ORDER BY avg_marks ASC
                LIMIT 1
            ");
            $lowSubject = $stmt->fetch();
            if ($lowSubject) {
                $insights[] = "Subject needing attention: {$lowSubject['subject_name']} with average of " . number_format($lowSubject['avg_marks'], 1);
            }
            
            // Get overall pass rate
            $stmt = $pdo->query("
                SELECT 
                    (SUM(CASE WHEN marks >= 40 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as pass_rate
                FROM marks
            ");
            $passRate = $stmt->fetch();
            if ($passRate['pass_rate']) {
                $insights[] = "Overall school pass rate: " . number_format($passRate['pass_rate'], 1) . "%";
            }
            
            // Get top performing grade level
            $stmt = $pdo->query("
                SELECT 
                    s.grade_level,
                    AVG(student_avg.avg_marks) as class_average
                FROM students s
                JOIN (
                    SELECT student_id, AVG(marks) as avg_marks
                    FROM marks
                    GROUP BY student_id
                ) student_avg ON s.id = student_avg.student_id
                GROUP BY s.grade_level
                ORDER BY class_average DESC
                LIMIT 1
            ");
            $topGrade = $stmt->fetch();
            if ($topGrade) {
                $insights[] = "Top performing grade level: Grade {$topGrade['grade_level']} with class average of " . number_format($topGrade['class_average'], 1);
            }
            
            echo json_encode(['success' => true, 'insights' => $insights]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
