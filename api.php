<?php
/**
 * The Blue Pig - Volunteer Rota
 * API Endpoints
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$db = getDB();

switch ($action) {
    // SHIFTS
    case 'get_shifts':
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');
        
        $stmt = $db->prepare("SELECT * FROM shifts WHERE date BETWEEN ? AND ? ORDER BY date, shift_type");
        $stmt->execute([$startDate, $endDate]);
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'add_shift':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception('Invalid JSON data');
            }
            
            $quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;
            if ($quantity < 1) $quantity = 1;
            if ($quantity > 10) $quantity = 10; // Safety limit

            $stmt = $db->prepare("INSERT INTO shifts (volunteer_name, subtitle, date, shift_type, custom_start_time, custom_end_time) VALUES (?, ?, ?, ?, ?, ?)");
            
            $lastId = 0;
            for ($i = 0; $i < $quantity; $i++) {
                $result = $stmt->execute([
                    $data['volunteer_name'] ?? null,
                    $data['subtitle'] ?? null,
                    $data['date'],
                    $data['shift_type'],
                    $data['custom_start_time'] ?? null,
                    $data['custom_end_time'] ?? null
                ]);
                
                if (!$result) {
                    throw new Exception('Database insert failed');
                }
                $lastId = $db->lastInsertId();
            }
            
            echo json_encode(['success' => true, 'id' => $lastId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'update_shift':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                throw new Exception('Invalid JSON data or missing ID');
            }
            
            $stmt = $db->prepare("UPDATE shifts SET volunteer_name = ?, subtitle = ?, date = ?, shift_type = ?, custom_start_time = ?, custom_end_time = ? WHERE id = ?");
            $result = $stmt->execute([
                $data['volunteer_name'] ?? null,
                $data['subtitle'] ?? null,
                $data['date'],
                $data['shift_type'],
                $data['custom_start_time'] ?? null,
                $data['custom_end_time'] ?? null,
                $data['id']
            ]);
            
            if (!$result) {
                throw new Exception('Database update failed');
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'delete_shift':
        try {
            $id = $_GET['id'] ?? $_POST['id'] ?? 0;
            if (!$id) {
                throw new Exception('Invalid ID');
            }
            
            $stmt = $db->prepare("DELETE FROM shifts WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if (!$result) {
                throw new Exception('Database delete failed');
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    // EVENTS
    case 'get_events':
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');
        
        $stmt = $db->prepare("SELECT * FROM events WHERE date BETWEEN ? AND ? ORDER BY date, start_time");
        $stmt->execute([$startDate, $endDate]);
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'add_event':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception('Invalid JSON data');
            }
            
            $stmt = $db->prepare("INSERT INTO events (title, date, start_time, end_time) VALUES (?, ?, ?, ?)");
            $result = $stmt->execute([
                $data['title'],
                $data['date'],
                $data['start_time'],
                $data['end_time']
            ]);
            
            if (!$result) {
                throw new Exception('Database insert failed');
            }
            
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'update_event':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                throw new Exception('Invalid JSON data or missing ID');
            }
            
            $stmt = $db->prepare("UPDATE events SET title = ?, date = ?, start_time = ?, end_time = ? WHERE id = ?");
            $result = $stmt->execute([
                $data['title'],
                $data['date'],
                $data['start_time'],
                $data['end_time'],
                $data['id']
            ]);
            
            if (!$result) {
                throw new Exception('Database update failed');
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'delete_event':
        try {
            $id = $_GET['id'] ?? $_POST['id'] ?? 0;
            if (!$id) {
                throw new Exception('Invalid ID');
            }
            
            $stmt = $db->prepare("DELETE FROM events WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if (!$result) {
                throw new Exception('Database delete failed');
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
