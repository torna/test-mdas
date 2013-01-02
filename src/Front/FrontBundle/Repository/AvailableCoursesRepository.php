<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class AvailableCoursesRepository extends EntityRepository {

    public function getCourseTeacherByObjectId($teacher_id, $object_id) {
        $query = "
            SELECT * 
            FROM available_courses ac
            WHERE ac.teacher_id=:teacher_id
            AND ac.object_id=:object_id
            AND ac.course_status IN('ongoing', 'waiting', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':object_id' => $object_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function getCourseTeacherByCourseId($teacher_id, $course_id) {
        $query = "
            SELECT ac.*, so.*, ac.id as id 
            FROM available_courses ac, system_objects so
            WHERE ac.teacher_id=:teacher_id
            AND ac.object_id=so.id
            AND ac.id=:course_id
            AND ac.course_status IN('ongoing', 'waiting', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':course_id' => $course_id));
        $result = $q->fetch(2);

        return $result;
    }
    
    public function getTeacherCourses($teacher_id) {
        $query = "
            SELECT 
                ac.*, ac.id as course_id, so.*, l.language,
                (SELECT count(id) FROM enrolled WHERE course_id=ac.id AND is_deleted=0) AS cnt_enrolled
            FROM available_courses ac, system_objects so, languages l
            WHERE ac.teacher_id=:teacher_id
            AND ac.object_id=so.id
            AND ac.course_language=l.id
            AND ac.course_status IN('ongoing', 'waiting', 'finished')
            GROUP BY ac.id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function createCourse($teacher_id, $object_id, $max_nr_students, $course_topics, $course_details, $starts_on, $language_id, $finish_on, $group_name) {
        $params = array();
        
        $query = "
            INSERT INTO available_courses(teacher_id, object_id, max_nr_students, course_topics, course_details, starts_on, finish_on, course_language, group_name, course_status, added)
            VALUES (:teacher_id, :object_id, :max_nr_students, :course_topics, :course_details, :starts_on, :finish_on, :course_language, :group_name, 'waiting', NOW())
        ";
        
        $params[':teacher_id'] = $teacher_id;
        $params[':object_id'] = $object_id;
        $params[':max_nr_students'] = $max_nr_students;
        $params[':course_topics'] = $course_topics;
        $params[':course_details'] = $course_details;
        $params[':starts_on'] = $starts_on;
        $params[':course_language'] = $language_id;
        $params[':finish_on'] = $finish_on;
        $params[':group_name'] = $group_name;
        
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function setCourseDeleted($teacher_id, $course_id) {
        $query = "UPDATE available_courses SET course_status='deleted' WHERE id=:course_id AND teacher_id=:teacher_id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id, ':teacher_id' => $teacher_id));
    }
    
    public function getLanguages() {
        $query = "SELECT * FROM languages";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
        return $q->fetchAll(2);
    }
    
    public function getAvailableCourses($object_id = 0) {
        $sql = '';
        if($object_id) {
            $sql .= " AND ac.object_id=".$object_id;
        }
        $query = "
            SELECT so.*, ac.*, (SELECT count(id) FROM enrolled WHERE course_id=ac.id AND is_deleted=0) as cnt_enrolled, l.language
            FROM available_courses ac, system_objects so, languages l
            WHERE ac.object_id = so.id
            AND ac.course_status IN('waiting')
            AND ac.course_language=l.id
            ".$sql."
            GROUP BY ac.id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array());
        return $q->fetchAll(2);
    }
    
    public function getCourseById($course_id) {
        $query = "
            SELECT ac.*, so.*, ac.id as id, (SELECT count(id) FROM enrolled WHERE course_id=ac.id AND is_deleted=0) as cnt_enrolled, l.language 
            FROM available_courses ac, system_objects so, languages l
            WHERE ac.object_id=so.id
            AND ac.id=:course_id
            AND ac.course_language=l.id
            AND ac.course_status IN('ongoing', 'waiting', 'finished')
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id));
        $result = $q->fetch(2);

        return $result;
    }
    
    public function getCheckIfCourseIsStarted($course_id) {
        $query = "
            SELECT count(*) AS cnt
            FROM ongoing_courses oc
            WHERE oc.course_id=:course_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id));
        $result = $q->fetch(2);

        return $result['cnt'];
    }
    
    public function storeUserToken($user_id, $course_id, $token, $is_teacher) {
        // deleting previous record
        $query = "
            DELETE FROM course_participants 
            WHERE course_id=:course_id 
            AND user_id=:user_id 
            AND is_teacher=:is_teacher
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id, ':user_id' => $user_id, ':is_teacher' => $is_teacher));
        
        // inserting new record
        $query = "
            INSERT INTO course_participants(course_id, user_id, is_teacher, token_new)
            VALUES(:course_id, :user_id, :is_teacher, :token_new)
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':course_id' => $course_id, ':user_id' => $user_id, ':is_teacher' => $is_teacher, 'token_new' => $token));
    }
    
    public function checkTokenValid($user_id, $token, $is_teacher) {
        $query = "
            SELECT cp.*
            FROM course_participants cp
            WHERE cp.user_id=:user_id
            AND cp.token_new=:token
            AND cp.is_teacher=:is_teacher
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':user_id' => $user_id, ':token' => $token, ':is_teacher' => $is_teacher));
        $result = $q->fetch(2);

        return $result;
    }
    
}