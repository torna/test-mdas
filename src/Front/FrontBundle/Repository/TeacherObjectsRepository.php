<?php

namespace Front\FrontBundle\Repository;
use Doctrine\ORM\EntityRepository;

class TeacherObjectsRepository extends EntityRepository {

    /**
     * teacher objects
     * @param type $teacher_id
     * @return type
     */
    public function teacherObjects($teacher_id) {
        $query = "
            SELECT *, `to`.id AS teacher_object_id
            FROM teacher_objects `to`, system_objects so
            WHERE `to`.object_id=so.id
            AND `to`.teacher_id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetchAll(2);

        return $result;
    }
    
    public function deleteTeacherObject($teacher_id, $object_id) {
        $query = "
            DELETE
            FROM teacher_objects
            WHERE teacher_id=:teacher_id
            AND object_id=:object_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id, ':object_id' => $object_id));
    }
    
    public function teacherObjectsCnt($teacher_id) {
        $query = "
            SELECT COUNT(`to`.id) AS cnt
            FROM teacher_objects `to`
            WHERE `to`.teacher_id=:teacher_id
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        $result = $q->fetch(2);

        return $result['cnt'];
    }
    
    /**
     * adds teacher objects
     * @param type $teacher_id
     * @param type $objects
     */
    public function addObjects($teacher_id, $objects, $object_experience) {
        $cnt = count($objects);
        for ($i = 0; $i < $cnt; $i++) {
            $query = "
                INSERT INTO teacher_objects(teacher_id, object_id, experience_years, added)
                VALUES(:teacher_id, '".$objects[$i]."', '".$object_experience[$i]."', NOW())
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':teacher_id' => $teacher_id));
        }
    }
    
}