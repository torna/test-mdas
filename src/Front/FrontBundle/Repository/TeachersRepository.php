<?php

namespace Front\FrontBundle\Repository;

class TeachersRepository extends UserRepository {

    public function addUserData($id, $params) {
        unset($params['age']);
        $params['teacher_folder'] = md5($id . rand(1, 9));
        \Front\FrontBundle\Libs\CommonLib::createTeacherFolder($params['teacher_folder']);
        parent::addUserData($id, $params);
    }

    public function getTeacherScheduleData($teacher_id) {
        $return = array();

        // getting teachers courses
        $query = "
            SELECT ac.*, so.*, ac.id as id
            FROM available_courses ac, system_objects so
            WHERE ac.teacher_id=:teacher_id
            AND ac.object_id=so.id
            AND ac.course_status IN('waiting', 'ongoing', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $courses = $q->fetchAll(2);

        // for each course get schedule
        $cnt = count($courses);
        for ($i = 0; $i < $cnt; $i++) {
            $course_id = $courses[$i]['id'];
            $query = "
                SELECT cs.* 
                FROM course_schedule cs
                WHERE cs.course_id=" . $course_id . "
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
            $course_schedule = $q->fetchAll(2);
            $return[$course_id] = array('data' => $courses[$i], 'schedule' => $course_schedule);
        }

        return $return;
    }

    public function getTeachersWithObjects($active = true, $teacher_id = false) {
        $return = array();
        $sql = '';

        if ($active) {
            $sql .= ' AND t.is_deleted=0 AND t.is_activated=1 AND t.has_completed_profile=1';
        }

        if (is_numeric($teacher_id)) {
            $sql .= ' AND t.id=' . $teacher_id;
        }
        $query = "
            SELECT * 
            FROM teachers t
            WHERE 1=1
            " . $sql . "
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
        $teacher_list = $q->fetchAll(2);

        $cnt = count($teacher_list);
        for ($i = 0; $i < $cnt; $i++) {
            $query = "
                SELECT so.*, to.experience_years
                FROM system_objects so, teacher_objects `to`
                WHERE `to`.object_id=so.id
                AND so.is_active=1
                AND `to`.teacher_id=" . $teacher_list[$i]['id'] . "
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
            $teacher_objects = $q->fetchAll(2);
            $return[] = array('teacher_data' => $teacher_list[$i], 'teacher_objects' => $teacher_objects);
        }
        return $return;
    }

    public function getTeacherData($teacher_id) {
        $query = "
            SELECT t.*
            FROM teachers t
            WHERE t.id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function getTeacherPresentationList($teacher_id) {
        $query = "
            SELECT tp.*
            FROM teacher_presentations tp
            WHERE tp.teacher_id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetchAll(2);
        return $result;
    }
    
    public function createPresentation($teacher_id, $presentation_name, $presentation_desc) {
        $params = array();

        $query = "
            INSERT INTO teacher_presentations(teacher_id, presentation_name, presentation_desc, presentation_hash, added)
            VALUES (:teacher_id, :presentation_name, :presentation_desc, :presentation_hash, NOW())
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':presentation_name'] = $presentation_name;
        $params[':presentation_desc'] = $presentation_desc;
        $params[':presentation_hash'] = md5($presentation_desc.$presentation_name.$teacher_id.time());

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function updatePresentation($teacher_id, $presentation_id, $presentation_name, $presentation_desc) {
        $params = array();

        $query = "
            UPDATE teacher_presentations SET presentation_name=:presentation_name, presentation_desc=:presentation_desc
            WHERE id=:presentation_id AND teacher_id=:teacher_id
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':presentation_id'] = $presentation_id;
        $params[':presentation_name'] = $presentation_name;
        $params[':presentation_desc'] = $presentation_desc;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function getTeacherPresentationDetails($teacher_id, $presentation_id) {
        $query = "
            SELECT tp.*
            FROM teacher_presentations tp
            WHERE tp.teacher_id=:teacher_id
            AND tp.id=:presentation_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':presentation_id' => $presentation_id));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function deletePresentation($teacher_id, $presentation_id) {
        $query = "
            DELETE FROM teacher_presentations
            WHERE teacher_id=:teacher_id
            AND id=:presentation_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':presentation_id' => $presentation_id));
    }

    public function getTeacherPresentationSheets($teacher_id, $presentation_id) {
        $query = "
            SELECT ps.*
            FROM teacher_presentations tp, presentation_sheets ps
            WHERE tp.teacher_id=:teacher_id
            AND tp.id=:presentation_id
            AND ps.presentation_id=tp.id
            ORDER BY ps.sheet_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':presentation_id' => $presentation_id));
        $result = $q->fetchAll(2);
        return $result;
    }

    public function getTeacherPresentationSheetsBySheetHash($presentation_hash) {
        $query = "
            SELECT ps.*
            FROM teacher_presentations tp, presentation_sheets ps
            WHERE tp.presentation_hash=:presentation_hash
            AND ps.presentation_id=tp.id
            ORDER BY ps.sheet_order ASC
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':presentation_hash' => $presentation_hash));
        $result = $q->fetchAll(2);
        return $result;
    }
    
    public function createPresentationSheet($presentation_id, $svg_data) {
        $params = array();

        $query = "
            INSERT INTO presentation_sheets(presentation_id, sheet_content, added)
            VALUES (:presentation_id, :sheet_content, NOW())
        ";

        $params[':presentation_id'] = $presentation_id;
        $params[':sheet_content'] = $svg_data;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function updatePresentationSheet($sheet_id, $svg_data) {
        $params = array();

        $query = "
            UPDATE presentation_sheets SET sheet_content=:sheet_content
            WHERE id=:sheet_id
        ";

        $params[':sheet_content'] = $svg_data;
        $params[':sheet_id'] = $sheet_id;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function updatePresentationSheetOrder($sheet_id, $order) {
        $query = "
            UPDATE presentation_sheets SET sheet_order=:sheet_order
            WHERE id=:sheet_id
        ";

        $params[':sheet_order'] = $order;
        $params[':sheet_id'] = $sheet_id;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function deletePresentationSheet($teacher_id, $sheet_id) {
        $query = "
            DELETE FROM presentation_sheets 
            WHERE id=:sheet_id
            AND presentation_id IN (SELECT id FROM teacher_presentations WHERE teacher_id=:teacher_id)
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':sheet_id'] = $sheet_id;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function duplicatePresentationSheet($teacher_id, $sheet_id) {
        $query = "
            INSERT INTO presentation_sheets (presentation_id, sheet_name, sheet_order, sheet_content, added)
            SELECT presentation_id, sheet_name, sheet_order, sheet_content, NOW() FROM presentation_sheets 
            WHERE id=:sheet_id
            AND presentation_id IN (SELECT id FROM teacher_presentations WHERE teacher_id=:teacher_id)
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':sheet_id'] = $sheet_id;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function getPresentationSheetDetails($teacher_id, $sheet_id) {
        $query = "
            SELECT ps.* FROM presentation_sheets ps, teacher_presentations tp
            WHERE ps.id=:sheet_id
            AND tp.teacher_id=:teacher_id
            AND ps.presentation_id=tp.id
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':sheet_id'] = $sheet_id;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $q->fetch(2);
    }

    /**
     * used in UserRepository
     * @return string
     */
    public function getTableName() {
        return 'teachers';
    }

}