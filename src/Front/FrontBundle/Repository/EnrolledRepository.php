<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class EnrolledRepository extends EntityRepository {

    /**
     * student courses
     * @param type $student_id
     * @return type
     */
    public function getStudentCourses($student_id) {
        $query = "
            SELECT so.*, l.language, ac.*, (SELECT count(id) FROM enrolled WHERE course_id=ac.id AND is_deleted=0) AS cnt_enrolled, e.is_payed
            FROM enrolled e, available_courses ac, system_objects so, languages l
            WHERE e.student_id=:student_id
            AND e.course_id=ac.id
            AND ac.object_id=so.id
            AND ac.course_language=l.id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':student_id' => $student_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function setEnrollDeleted($student_id, $course_id) {
        $query = "
            UPDATE enrolled SET is_deleted=1, delete_date=NOW() 
            WHERE course_id=:course_id
            AND student_id=:student_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':student_id' => $student_id, ':course_id' => $course_id));
    }
    
    public function setUnEnroll($student_id, $course_id) {
        $query = "
            DELETE FROM enrolled
            WHERE course_id=:course_id
            AND student_id=:student_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':student_id' => $student_id, ':course_id' => $course_id));
    }
    
    public function enroll($student_id, $course_id) {
        $query = "
            INSERT INTO enrolled(course_id, student_id, pay_id, added)
            VALUES(:course_id, :student_id, :pay_id, NOW())
        ";
        
        $params = array();
        $params[':student_id'] = $student_id;
        $params[':course_id'] = $course_id;
        $params[':pay_id'] = $student_id.$course_id.rand(1, 30);
        
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    /**
     * check if studend is enrolled on course and had payed
     * @param type $student_id
     * @param type $course_id
     */
    public function checkIfEnrolledAndPayed($student_id, $course_id) {
        $query = "
            SELECT e.* 
            FROM enrolled e
            WHERE e.student_id=:student_id
            AND e.course_id=:course_id
        ";
        
        $params = array();
        $params[':student_id'] = $student_id;
        $params[':course_id'] = $course_id;
        
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        
        $result = $q->fetch(2);
        return $result;
    }
    
}