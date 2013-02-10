<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class TeacherTestsRepository extends EntityRepository {

    public function getTeacherTests($teacher_id) {
        $query = "
            SELECT tt.*
            FROM teacher_tests tt
            WHERE tt.teacher_id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function getTeacherTestDetails($teacher_id, $test_id) {
        $query = "
            SELECT tt.*
            FROM teacher_tests tt
            WHERE tt.teacher_id=:teacher_id
            AND tt.id=:test_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':test_id' => $test_id));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function getTestDetailsByHash($test_hash) {
        $query = "
            SELECT tt.*
            FROM teacher_tests tt
            WHERE tt.test_hash=:test_hash
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':test_hash' => $test_hash));
        $result = $q->fetch(2);
        return $result;
    }
    
    public function createTest($teacher_id, $test_name_public, $test_name_private, $test_desc, $test_type) {
        $params = array();

        $query = "
            INSERT INTO teacher_tests(teacher_id, test_name_public, test_name_private, test_desc, test_type, test_hash, added)
            VALUES (:teacher_id, :test_name_public, :test_name_private, :test_desc, :test_type, :test_hash, NOW())
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':test_name_public'] = $test_name_public;
        $params[':test_name_private'] = $test_name_private;
        $params[':test_desc'] = $test_desc;
        $params[':test_type'] = $test_type;
        $params[':test_hash'] = md5($teacher_id.time());

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        return $this->getEntityManager()->getConnection()->lastInsertId();
    }
    
    public function updateTest($teacher_id, $test_id, $test_name_public, $test_name_private, $test_desc, $test_type) {
        $params = array();

        $query = "
            UPDATE teacher_tests SET test_name_public=:test_name_public, test_name_private=:test_name_private, test_desc=:test_desc, test_type=:test_type
            WHERE id=:test_id AND teacher_id=:teacher_id
        ";

        $params[':teacher_id'] = $teacher_id;
        $params[':test_id'] = $test_id;
        $params[':test_name_public'] = $test_name_public;
        $params[':test_name_private'] = $test_name_private;
        $params[':test_desc'] = $test_desc;
        $params[':test_type'] = $test_type;

        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
    }
    
    public function deleteTest($teacher_id, $test_id) {
        $query = "
            DELETE FROM teacher_tests
            WHERE teacher_id=:teacher_id
            AND id=:test_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':test_id' => $test_id));
    }
    
}