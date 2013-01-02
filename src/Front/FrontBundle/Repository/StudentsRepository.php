<?php

namespace Front\FrontBundle\Repository;

class StudentsRepository extends UserRepository {
    
    public function addUserData($id, $params) {
        parent::addUserData($id, $params);
    }
    
    public function isEnrolledOnCourse($student_id, $course_id) {
        $query = "
            SELECT *
            FROM enrolled e
            WHERE e.student_id=:student_id
            AND e.course_id=:course_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':student_id' => $student_id, ':course_id' => $course_id));
        $result = $q->fetch(2);
        
        return $result;
    }
    
    public function getStudentScheduleData($student_id) {
        $return = array();

        // getting teachers courses
        $query = "
            SELECT ac.*, so.*, ac.id as id
            FROM available_courses ac, system_objects so, enrolled e
            WHERE e.student_id=:student_id
            AND ac.id=e.course_id
            AND ac.object_id=so.id
            AND ac.course_status IN('waiting', 'ongoing', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':student_id' => $student_id));
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
    
    public function getTableName() {
        return 'students';
    }
    
}